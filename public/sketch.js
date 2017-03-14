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
	socket.on('connect', sendMyShip);
		
	//create new ships entering the battlefield
	socket.on('shipsFromServer', function(shipData){
		console.log(shipData);
		//only create new ship if it doesn't exist in 
		if( (shipData.socketID in ships) === false){
			ships[shipData.socketID] = new Ship(shipData.color, shipData.socketID);
			totalShips++;
			sendMyShip();
		}		
	});
		
	socket.on('leftGame', function(socketID){
		console.log(socketID);
		console.log(ships[socketID]);
		//ships[socketID] = ;
		//delete ships[socketID];
		//delete shipAttr[socketID];
		//console.log(ships);
	});
	
}

function sendMyShip(){
	var shipAttr = {
		'color': ships.myself.color,
		'socketID': socket.id
	};
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
	
	for( key in ships){
		//if(key !== 'myself')	ships[key].render();
		if(key !== undefined){
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
	//socket.emit(
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
	
	//socket
}
