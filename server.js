//sending events and data across all clients`
var socket = require('socket.io');
//file system of local directory
var fs = require('fs');
var express = require('express');		//Web framework

var app = express();					//initiliaze express object to app
var server = app.listen(3000);

app.use(express.static('public'));		//the folder to host to the website. public can see those files


console.log("My socket server is running");
var connections = [];

//Attach Input & Output to the server
var io = socket(server);

//Trigger when a user connects
io.sockets.on('connection', newConnect);

//checking for first connection
var zerolayer = true;

function newConnect(socket) {
	console.log('New Connection: ' + socket.id);
	connections.push(socket.id);
	console.log('Connected: %s ', connections.length);
	
	//first player will create the astroids
	if(connections.length === 1 && zerolayer === true){
		//console.log('FirstPlayer');
		io.sockets.emit('firstShipCreateAsteroid');
		zerolayer = false;
	}
	
	socket.on('sendAsteroid', function(asteroidInfoFirstPlayer){
		console.log('Data sent');
		socket.broadcast.emit('asteroidFromServer', asteroidInfoFirstPlayer);
	});
	
	//listens for newship event from new user and send to all other clients
	socket.on('newShip', function(newShipAttr){
		//console.log(asteroidInformation);
		
		//send shipFromServer event to all clients except the sender
		socket.broadcast.emit('shipsFromServer', newShipAttr);
		
		//send sendShip event to all clients and the sender		
		//io.sockets.emit('sendShip', data);
	});
	
	socket.on('shipMovement', function(shipsMovementFromServer){
		//console.log(shipsMovementFromServer);
		socket.broadcast.emit('shipMoved', shipsMovementFromServer);
	});

	//Disconnect
	socket.on('disconnect', function(data){
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected... %s left', connections.length);
		if(connections.length === 0) zerolayer = true;
		socket.broadcast.emit('leftGame', socket.id);
	});
	
}
