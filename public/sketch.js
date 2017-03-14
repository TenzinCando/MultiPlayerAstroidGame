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

//Triggers on each new load
function setup() {
	//canvas size
	createCanvas((windowWidth * .8), (windowHeight * .8));
	//background clipboardData
	background(51);
	
	//set up ships & astroids
	//ship = new Ship();
	ships.myself = new Ship();
	
	for (var i = 0; i < 5; i++) {
		asteroids.push(new Asteroid());
		//storeAsteroidInfo(i);
	}
	
	totalShips = 1;
	
	//connecting client & server sockets
	socket = io('http://localhost:3000');
	
	//sending new ship Attr to all other clients
	socket.on('connect', sendMyShip);
	
	socket.on('firstShipCreateAsteroid', function(){
		//console.log('First Player');
		
		var asteroidInfo = {};
		
		for (var i = 0; i < 5; i++) {
			asteroids.push(new Asteroid());
			//console.log(asteroidInfo);
			storeAsteroidInfo(i);
		}
		//console.log(asteroidInfo);
		// socket.emit('sendAsteroids', asteroidInfo);
	});
	
	//create the same asteroids for all other clients online
	socket.on('asteroidFromServer', function(asteroidInformation){
		console.log(asteroidInformation);
		var tempPos = createVector(asteroidInformation.asteroidposition[0],asteroidInformation.asteroidposition[1]);
		var tempAsteroids = asteroids.push(new Asteroid(tempPos, asteroidInformation.asteroidrotation));
		console.log(tempAsteroids);
	});
	
	//create new ships entering the battlefield
	socket.on('shipsFromServer', function(shipData){
		..console.log(shipData);
		//console.log(asteroidsFromServer);
		//only create new ship if it doesn't exist in 
		if( (shipData.socketID in ships) === false){
			ships[shipData.socketID] = new Ship(shipData.color, shipData.socketID);
			console.log(shipData);

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
		ship = ships[shipMoves.socketID];
		//console.log(ship);
		ship.setRotation(shipMoves.rotation);
		ship.boosting(shipMoves.boosting);
		
		// ship.render();
		// ship.turn();
		// ship.update();
		// ship.edges();
		//console.log(ships[key].render);		
	});
	
	socket.on('leftGame', function(socketID){
		//console.log(socketID);
		//console.log(ships[socketID]);
		//ships[socketID] = ;
		delete ships[socketID];
		if(ship.socketID === socketID) delete ship;
		//console.log(ships);
	});	
}

function storeAsteroidInfo(index){
	asteroidInfo = {
		'asteroidposition': [asteroids[index].pos.x, asteroids[index].pos.y],
		'asteroidrotation': asteroids[index].r,
		'asteroidveolicty': [asteroids[index].vel.x, asteroids[index].vel.y],
		'asteroidTotal': asteroids[index].total,
		'asteroidOffset': asteroids[index].offset
	};
	//console.log(asteroidInfo);
	socket.emit('sendAsteroid', asteroidInfo);
}

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
	//console.log(asteroidInfo);
	socket.emit('newShip', shipAttr);
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
