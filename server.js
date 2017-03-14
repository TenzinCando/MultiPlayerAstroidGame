//sending events and data across all clients`
var socket = require('socket.io');
//file system of local directory
var fs = require('fs');
var http = require('http');
var express = require('express');		//Web framework
var app = express();					//initiliaze express object to app

app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));		//the folder to host to the website. public can see those files

//var server = app.listen(3000);
var server = http.createServer(app).listen(app.get('port'));

console.log("My socket server is running");
var connections = [];

//Attach Input & Output to the server
var io = socket(server);

//Trigger when a user connects
io.sockets.on('connection', newConnect);

//checking for first connection
var zerolayer = true;
//save asteroids to send to others when connection exceeds 1
var asteroids;

//--------------------------------------------------------------------------
//-------------------------------- AWS Service------------------------------
//--------------------------------------------------------------------------

//Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);
var AWS = require('aws-sdk');

//Create DynamoDB client and pass in region.
var db = new AWS.DynamoDB({region: config.AWS_REGION});
//Create SNS client and pass in region.
var sns = new AWS.SNS({ region: config.AWS_REGION});
//Create S3 client and pass in region
var s3 = new AWS.S3({ region: config.AWS_REGION});

//--------------------------------------------------------------------------
//-------------------------------END AWS Service----------------------------
//--------------------------------------------------------------------------


function newConnect(socket) {
	console.log('New Connection: ' + socket.id);
	connections.push(socket.id);
	console.log('Connected: %s ', connections.length);
	
	//send set of asteroids 
	if(asteroids !== undefined){
		//console.log("got set of asteroids");
		socket.broadcast.emit('newPlayerAsteroids', asteroids);
	}	
	
	socket.on('sendAsteroid', function(asteroidInfoFirstPlayer){
		console.log('Data sent');
		socket.broadcast.emit('asteroidFromServer', asteroidInfoFirstPlayer);
	});
	
	//listens for newship event from new user and send to all other clients
	socket.on('newShip', function(newShipAttr, asteroidInformation){
		//console.log(asteroidInformation);
		
		//first player will create the astroids
		if(connections.length === 1 && zerolayer === true){
			asteroids = asteroidInformation;
			//console.log('FirstPlayer');
			//io.sockets.emit('firstShipCreateAsteroid');
			zerolayer = false;
			sendNotification();
		}
		
		//send shipFromServer event to all clients except the sender
		socket.broadcast.emit('shipsFromServer', newShipAttr);
		uploadData(socket.id, newShipAttr);
		//send sendShip event to all clients and the sender		
		//io.sockets.emit('sendShip', data);
	});
	
	socket.on('shipMovement', function(shipsMovementFromClient){
		//console.log(shipsMovementFromServer);
		socket.broadcast.emit('shipMoved', shipsMovementFromClient);
	});

	//Disconnect
	socket.on('disconnect', function(data){
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected... %s left', connections.length);
		if(connections.length === 0) zerolayer = true;
		
		socket.broadcast.emit('leftGame', socket.id);
		
	});

}


//Upload ship data to DynamoDB and create empty map if the socket-id doesn't exist
var uploadData = function (socketId, shipAttrs){
	console.log('Adding ship to DB');
	console.log('socket: ' + socketId);
	console.log(shipAttrs.windowX);
	
	var addData = {
		TableName: config.QUERY_TABLE,
		Key: {
			'socket-id': {'S': socketId}
		},
		ExpressionAttributeNames: {
			'#saWX': 'ship-attr.windowX',
			'#saWY': 'ship-attr.windowY',
			'#saPX': 'ship-attr.posX',
			'#saPY': 'ship-attr.posY',
			'#saDR': 'ship-attr.direction',
			'#saCL': 'ship-attr.color',
		},
		UpdateExpression: 'SET #saWX = :WX, #saWY = :WY, #saPX = :PX, #saPY = :PY, #saDR = :DR, #saCL = :CL',
		ExpressionAttributeValues:{
			':WX': {'N': shipAttrs.windowX.toString()},
			':WY': {'N': shipAttrs.windowY.toString()},
			':PX': {'N': shipAttrs.posX.toString()},
			':PY': {'N': shipAttrs.posY.toString()},
			':DR': {'N': shipAttrs.direction.toString()},			
			':CL': {'NS': [shipAttrs.color[0].toString(),shipAttrs.color[1].toString(),shipAttrs.color[2].toString()]}
		}
	};
	console.log(addData);
	//add map socket-id: ship-attr{} to DB
	db.updateItem(addData, function(err, data) {
		//create a empty columns for new item
		if (err) {
			console.log('Error adding data to DB\n' + err);
			var createMap = {
				TableName: config.QUERY_TABLE,
				Key: {
					'socket-id': {'S': socketId}
				},
				ExpressionAttributeNames: {
					'#sa': 'ship-attr'
				},
				UpdateExpression: 'SET #sa = :empty',
				ExpressionAttributeValues:{
					':empty': { 'M': {
						'windowX': {'N' : '0'},
						'windowY': {'N' : '0'},
						'posX': {'N' : '0'},
						'posY': {'N' : '0'},
						'direction': {'N' : '0'},
						'color': {'NS' : ['0','0','0']},
						}
					}
				}
			};
			//console.log(createMap);
			db.updateItem(createMap, function(error, data){
				if (err) {
					console.log("Error adding empty map\n" + err);				
				}
				else {
					uploadData(socketId, shipAttrs); //add attribute after creating empty map
					
				}
			});
		}// an error occurred
		else{
			console.log('Successfully added' + JSON.stringify(data, null, 2) + 'to attribute');           // successful response
		}
	});
}

//Send a notification to myself from the first visit to the site
function sendNotification(){
	 var snsMessage = 'First Player!'; //Send SNS notification containing email from form.
     sns.publish({ TopicArn: config.SNS_MESSAGE, Message: snsMessage }, function(err, data) {
        if (err) {
          console.log('Error publishing SNS message: ' + err);
        } else {
          console.log('SNS message sent');
        }
      });  
}
