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
	}
	totalShips = 1;
	
	//connecting client & server sockets
	socket = io('http://localhost:3000');
		
	socket.on('connect', sendMyShip);
	socket.on('shipsFromServer', createShips);
		
	socket.on('leftGame', function(socketID){
		//console.log(socketID);
		console.log(ships[socketID]);
		delete ships[socketID];
		delete shipAttr[socketID];
		console.log(ships);
	});
	
		
}


//saving 1 ship attributes & sending to other clients
function sendMyShip(){
	shipAttr[socket.id] = {
		'isBoosting': ships.myself.isBoosting,
		'pos': [ships.myself.pos.x, ships.myself.pos.y],
		'r': ships.myself.r,
		'heading': ships.myself.heading,
		'rotation': ships.myself.rotation,
		'vel': [ships.myself.vel.x, ships.myself.vel.y],
		'color': ships.myself.color
	};
	
	//console.log(shipAttr);
	socket.emit('newShip', shipAttr);
}

//create new ships entering the battlefield
function createShips(shipData){
	console.log(shipData);
	for(key in shipData){
		//console.log(shipAttr.key);
		if(key !== socket.id){
			shipAttr[key] = shipData[key];
			//console.log(shipData[key].color);
			ships[key] = new Ship(shipData[key].color);
		}
		// }
	}
	
	socket.on('connect', sendMyShip);
	//shipAttr[shipData.socket.id] = shipData.socket.id;
	//console.log(shipAttr);
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
	
	//Sending existing user info back to the new user
	if(totalShips !== Object.keys(shipAttr).length){
		//console.log(totalShips);
		socket.emit('newShip', shipAttr);
		totalShips = Object.keys(shipAttr).length;
	}
	
	for( key in ships){
		//if(key !== 'myself')	ships[key].render();
		ships[key].render();
		ships[key].turn();
		ships[key].update();
		ships[key].edges();
		//console.log(ships[key].render);
	}
}

//Library in p5.js
function keyReleased() {
	ships.myself.setRotation(0);
	ships.myself.boosting(false);
}

//Library in p5.js
function keyPressed() {
	if (key == ' ') {
		lasers.push(new Laser(ships.myself.pos, ships.myself.heading));
	} else if (keyCode == RIGHT_ARROW) {
		ships.myself.setRotation(0.1);
		socket.on('connect', sendMyShip);
	} else if (keyCode == LEFT_ARROW) {
		ships.myself.setRotation(-0.1);
	} else if (keyCode == UP_ARROW) {
		ships.myself.boosting(true);
	}
}
