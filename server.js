var socket = require('socket.io');
var fs = require('fs');
var express = require('express');		//Web framework

var app = express();					//initiliaze express object to app
var server = app.listen(3000);

app.use(express.static('public'));		//the folder to host to the website. public can see those files


console.log("My socket server is running");

//Attach Input & Output to the server
var io = socket(server);

//Trigger when a user connects
io.sockets.on('connection', newConnect);

function newConnect(socket) {
	console.log('New Connection: ' + socket.id);
	
	//listens for shipAttr from new user and send to all other clients
	socket.on('newShip', newShipAttr);
	
	function newShipAttr(data){
		console.log(data);
		socket.broadcast.emit('sendShip', data);
	}
	
	//listens for mouseEvent from the new user and calls mouseMessage
	socket.on('mouse', mouseMessage);
	
	function mouseMessage(data){
		//send the mouse event to all other connected sockets
		socket.broadcast.emit('mouse', data);
		//io.sockets.emit('mouse', data);
		//console.log(data);
	}
}