// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/hacZU523FyM

// Modified Author: Tenzin Khando
// Modified Date: 3/11/2017

var ship;
var asteroids = [];
var lasers = [];
var socket;
var shipAttr = {};
var ships = {};
var totalShips;
var asteroidInfo = {};	//asteroid info to send to other clients
var canvas;
var inp;
var submitNameButton;

//Triggers on each new load
function setup() {
	//canvas size
	canvas = createCanvas( windowWidth, windowHeight);
	
	//background clipboardData
	background(51);
	
	//set up ships & astroids
	//ship = new Ship();
	ships.myself = new Ship();
	
	for (var i = 0; i < 5; i++) {
		asteroids.push(new Asteroid());
		storeAsteroidInfo(i);
	}
	
	asteroidInfo.windowSize = {
		'windowX': width,
		'windowY': height
	}
	totalShips = 1;
	
	//connecting client & server sockets
	socket = io('http://localhost:3000');

	
	//sending new ship Attr to all other clients
	socket.on('connect', sendMyShip);
	
	socket.on('newPlayerAsteroids', function(asteroidsFromServer){
		//console.log(asteroidsFromServer);
		
		// var asteroidInfo = {};
		for(key in asteroidsFromServer){
			if(  key !== 'windowSize') {
				//console.log(key);
				//console.log(asteroidsFromServer[key].asteroidOffset);
				asteroids[key].offset = asteroidsFromServer[key].asteroidOffset;
				//adjusting to different screen sizes
				asteroids[key].pos.x = asteroidsFromServer[key].asteroidPosition[0] * (width / asteroidsFromServer.windowSize.windowX);
				asteroids[key].pos.y = asteroidsFromServer[key].asteroidPosition[1] * (height / asteroidsFromServer.windowSize.windowY);
				asteroids[key].vel.x = asteroidsFromServer[key].asteroidVeolicty[0];			
				asteroids[key].vel.y = asteroidsFromServer[key].asteroidVeolicty[1];			
				asteroids[key].total = asteroidsFromServer[key].asteroidTotal;
				asteroids[key].r = asteroidsFromServer[key].asteroidRotation;
			}
		}

	});
	
	//create new ships entering the battlefield
	socket.on('shipsFromServer', function(shipData){
		
		//only create new ship if it doesn't exist in 
		if( (shipData.socketID in ships) === false){
			ships[shipData.socketID] = new Ship(shipData.color, shipData.socketID);
			//console.log(shipData);

			ships[shipData.socketID].pos.x = shipData.posX * (width /shipData.windowX) ;
			ships[shipData.socketID].pos.y = shipData.posY * (height /shipData.windowY);
			ships[shipData.socketID].heading = shipData.direction;
			//console.log(ships[shipData.socketID]);
			totalShips++;
			sendMyShip();
		}
	});
	
	//update all ships that move and display them
	socket.on('shipMoved', function(shipMoves){
		//console.log(shipMoves);
		ship = ships[shipMoves.socketID];
		ship.setRotation(shipMoves.rotation);
		ship.boosting(shipMoves.boosting);	
	});
	
	socket.on('leftGame', function(socketID){
		//console.log(socketID);
		//console.log(ships[socketID]);
		//ships[socketID] = ;
		delete ships[socketID];
		//console.log(socketID);
		if(ship.socketID === socketID) delete ship;
		//console.log(ships);
	});	
}

function storeAsteroidInfo(index){
	//console.log(asteroids[index].pos.x)	;
	asteroidInfo[index] = {
		'asteroidPosition': [asteroids[index].pos.x, asteroids[index].pos.y],
		'asteroidRotation': asteroids[index].r,
		'asteroidVeolicty': [asteroids[index].vel.x, asteroids[index].vel.y],
		'asteroidTotal': asteroids[index].total,
		'asteroidOffset': asteroids[index].offset
	};
	//console.log(asteroids[index]);
	//console.log(asteroidInfo[index]);
	//console.log(asteroidInfo);
	//socket.emit('sendAsteroid', asteroidInfo);
}

//Attaching socket id with user name
// function setSocketIDinForm(){
	// var sID = select('#socketID');
	// sID.value(socket.id);
// }

function sendMyShip(){
	var shipAttr = {
		'windowX': width,
		'windowY': height,
		'posX': ships.myself.pos.x,
		'posY': ships.myself.pos.y,
		'direction': ships.myself.heading,
		'color': ships.myself.color,
		'socketID': socket.id
	};
	console.log(asteroidInfo);
	socket.emit('newShip', shipAttr, asteroidInfo);
}

function draw() {
	background(51);
	
	for (var i = 0; i < asteroids.length; i++) {
		// if (ship.hits(asteroids[i])) {
			// console.log('ooops!');
		// }
		asteroids[i].render();
		asteroids[i].update();
		asteroids[i].edges();
	}

	for (var i = lasers.length - 1; i >= 0; i--) {
		lasers[i].render();
		lasers[i].update();
		if (lasers[i].offscreen()) {
		  lasers.splice(i, 1);
		} else {
		  for (var j = asteroids.length - 1; j >= 0; j--) {
			if (lasers[i].hits(asteroids[j])) {
			  if (asteroids[j].r > 10) {
				var newAsteroids = asteroids[j].breakup();
				asteroids = asteroids.concat(newAsteroids);
			  }
			  asteroids.splice(j, 1);
			  lasers.splice(i, 1);
			  break;
			}
		  }
		}
	}

	//console.log(lasers.length);
	if(ship !== undefined){
		ship.render();
		ship.turn();
		ship.update();
		ship.edges();
	}
	
	for( key in ships){
		//if(key !== 'myself')	ships[key].render();
		if(ship === undefined || key !== ship.socketID){
			ships[key].render();	//display ship
			ships[key].turn();		//rotate ship
			ships[key].update();	//move ship
			ships[key].edges();		//check edge
			//console.log(ships[key].render);
		}
	}
}

//Library in p5.js
function keyReleased() {
	ships.myself.setRotation(0);
	ships.myself.boosting(false);
	
	sendMovementToServer();
}

//Library in p5.js
function keyPressed() {
	if (key == ' ') {
		lasers.push(new Laser(ships.myself.pos, ships.myself.heading));
	} else if (keyCode == RIGHT_ARROW) {
		ships.myself.setRotation(0.1);
		
	} else if (keyCode == LEFT_ARROW) {
		ships.myself.setRotation(-0.1);
	} else if (keyCode == UP_ARROW) {
		ships.myself.boosting(true);
	}
	
	sendMovementToServer();
}

//send my movement to all other 
function sendMovementToServer(){
	var sendMovement = {
		'rotation': ships.myself.rotation,
		'boosting': ships.myself.isBoosting,
		'socketID': socket.id
	}
	//console.log(sendMovement);
	socket.emit('shipMovement', sendMovement);
}
