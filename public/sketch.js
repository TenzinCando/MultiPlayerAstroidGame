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

//Triggers on each new load
function setup() {
	//canvas size
	createCanvas((windowWidth * .8), (windowHeight * .8));
	//background clipboardData
	background(51);
	
	//set up ships & astroids
	ship = new Ship();
	for (var i = 0; i < 5; i++) {
		asteroids.push(new Asteroid());
	}

	//connecting client & server sockets
	socket = io('http://localhost:3000');
		
	socket.on('connect', sendMyShip);
	
	//Call newDrawing if server sends a mouse event
	socket.on('mouse', newDrawing);
	
	socket.on('sendShip', createShips);
	
	
}

//saving 1 ship attributes & sending to other clients
function sendMyShip(){
	shipAttr[socket.id] = {
		'isBoosting': ship.isBoosting,
		'pos': [ship.pos.x, ship.pos.y],
		'r': ship.r,
		'heading': ship.heading,
		'rotation': ship.rotation,
		'vel': [ship.vel.x, ship.vel.y],
		'color': ship.color
	};
	
	//console.log(shipAttr);
	socket.emit('newShip', shipAttr);
}

//create new ships entering the battlefield
function createShips(shipData){
	
	for(key in shipData){
		//console.log(shipAttr.key);
		// if(shipAttr.key === undefined){
		shipAttr[key] = shipData[key];
		//console.log(shipData[key].color);
		ships.key = new Ship(shipData[key].color);
		// }
	}
	
	//shipAttr[shipData.socket.id] = shipData.socket.id;
	//console.log(shipAttr);
}

function newDrawing(mouseData){
	noStroke();
	fill(255, 0, 100);
	//attach circle to mouse location
	ellipse(mouseData.x, mouseData.y, 10,10);
}

function mouseDragged(){
	noStroke();
	fill(255);
	//attach circle to mouse location
	ellipse(mouseX, mouseY, 10,10);
	
	//console.log(mouseX + ',' + mouseY);
	
	//save mouse location once dragged
	var mouseData = {
		x: mouseX,
		y: mouseY
	};
	
	//send an event called mouse to the server with mouseData
	socket.emit('mouse', mouseData);
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

	console.log(lasers.length);

	ship.render();
	ship.turn();
	ship.update();
	ship.edges();
}

//Library in p5.js
function keyReleased() {
	ship.setRotation(0);
	ship.boosting(false);
}

//Library in p5.js
function keyPressed() {
	if (key == ' ') {
		lasers.push(new Laser(ship.pos, ship.heading));
	} else if (keyCode == RIGHT_ARROW) {
		ship.setRotation(0.1);
	} else if (keyCode == LEFT_ARROW) {
		ship.setRotation(-0.1);
	} else if (keyCode == UP_ARROW) {
		ship.boosting(true);
	}
}
