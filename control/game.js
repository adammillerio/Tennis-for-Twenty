var game = new Phaser.Game(512, 512, Phaser.AUTO, 'game-div', {preload: preload, create: create, update: update});

var socket = io.connect('http://192.168.1.4:8001');

var dial;

var connected = false;

var curRotation;
var newRotation;
var deltaRotation;

var disconnectedText;
var fullText;

function preload() {
    game.load.image('dial', 'assets/dial.png');
}

function create() {
    game.stage.backgroundColor = 0xffffff;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    dial = game.add.sprite(256, 256, 'dial');
    dial.anchor.set(0.5);
    game.physics.enable(dial, Phaser.Physics.ARCADE);

    fullText = game.add.text(game.world.centerX - 200, game.world.centerY, 'Game full! Please refresh.', { font: "32px Arial", fill: "#ff0000", align: "center"});
    disconnectedText = game.add.text(game.world.centerX - 200, game.world.centerY, 'Disconnected! Please refresh.', { font: "32px Arial", fill: "#ff0000", align: "center"});

    fullText.visible = false;
    disconnectedText.visible = false;
}

function update() {
    if(connected == true) {
        curRotation = dial.rotation * (180 / Math.PI);
        dial.rotation = game.physics.arcade.angleToPointer(dial);
        newRotation = dial.rotation * (180 / Math.PI);

        deltaRotation = curRotation - newRotation;

        if(deltaRotation < -180)
            deltaRotation += 360;
        if(deltaRotation >= 180)
            deltaRotation -= 360;

        socket.emit('updateposition', deltaRotation);
    }
}

// Socket.IO
socket.on('onconnected', function(data) {
    console.log('Connected successfully to the socket.io server. My server side ID is ' + data.id);
    connected = true;
});

socket.on('gamefull', function() {
    connected = false;
    fullText.visible = true;
});

socket.on('playerdisconnected', function() {
    connected = false;
    disconnectedText.visible = true;
    socket.disconnect();
});
