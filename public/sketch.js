var socket;

//Triggers on each new load
function setup() {
	//canvas size
	createCanvas((windowWidth * .8), (windowHeight * .8));
	//background clipboardData
	background(51);
	
	socket = io.connect('http://localhost:3000');
	
	//Call newDrawing if server sends a mouse event
	socket.on('mouse', newDrawing);
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
}
yout