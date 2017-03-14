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
	
	//sending new ship Attr to all other clients
	socket.on('connect', function(){
		//sending ship Attr to all other clients
		ships.myself.socketId = socket.id;
		socket.emit('newShip', ships.myself.getAttr);
	});
	socket.on('shipsFromServer', createShips);
		
	socket.on('leftGame', function(socketID){
		//console.log(socketID);
		console.log(ships[socketID]);
		delete ships[socketID];
		//delete shipAttr[socketID];
		console.log(ships);
	});
	
		
}

function setAttr(socketID){
	
}


//create new ships entering the battlefield
function createShips(shipData){
	//console.log(shipData);
	//for(key in shipData){
		//console.log(shipAttr.key);
		//if(key !== socket.id){
			//shipAttr[key] = shipData[key];
			//console.log(shipData[key].color);
			ships[shipData.socketId] = new Ship(shipData.color);
		//}
		// }
	//}
	//socket.emit('newShip', ships.myself.getAttr);
	//socket.on('connect', function(){
		//sending ship Attr to all other clients
		//socket.emit('newShip', ships.myself.getAttr);
	//});
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
	if(totalShips !== Object.keys(ships).length){
		//console.log(totalShips);
		for(key in ships){
			//right of || only happens when key doesn't equal 'myself'
			var temp = (key !== 'myself') || socket.emit('newShip', ships[key].getAttr);
		}
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
		//socket.on('connect', sendMyShip);
	} else if (keyCode == LEFT_ARROW) {
		ships.myself.setRotation(-0.1);
	} else if (keyCode == UP_ARROW) {
		ships.myself.boosting(true);
	}
	
	//socket
}
