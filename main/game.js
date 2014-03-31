var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'game-div', {preload: preload, create: create, update: update});

var socket = io.connect('http://192.168.1.3:8001');

var paddle1Score = 0;
var paddle2Score = 0;

var paddle1;
var paddle2;
var ball;

var player1Position = 360;
var player2Position = 360;

var player1Connected = false;
var player2Connected = false;

var scoreText;

var wKey;
var sKey;
var upKey;
var downKey;
var fKey;

function preload() {
    console.log('Loaded main assets');
}

function create() {
    console.log('Registering lobby state');
    game.state.add('lobby', lobbyState);

    console.log('Registering main game state');
    game.state.add('game', gameState);

    console.log('Starting lobby state');
    game.state.start('lobby');
}

function update() {

}

var spinners;
var lobbyText;

var lobbyState = function(game) {};

lobbyState.prototype = {
    preload: function() {
        game.load.image('paddle1', 'assets/paddles/paddle1.png');
        game.load.image('paddle2', 'assets/paddles/paddle2.png');
        game.load.spritesheet('spinner', 'assets/spinner.png', 26, 26);
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        spinners = game.add.group();

        for(var i=0; i < 8; i++) {
            var spinner = spinners.create(game.world.centerX, game.world.centerY, 'spinner');
            spinner.animations.add('spin');
            spinner.animations.play('spin', 15, true);
            spinner.checkWorldBounds = true;
            game.physics.enable(spinner, Phaser.Physics.ARCADE);
            spinner.body.collideWorldBounds = true;
            spinner.body.bounce.set(1);
            spinner.body.velocity.y = Math.floor((Math.random() * -300) + 300);
            spinner.body.velocity.x = Math.floor((Math.random() * -300) + 300);
        }

        lobbyText = game.add.text(game.world.centerX - 125, game.world.centerY, 'Waiting for Players', { font: "32px Arial", fill: "#ffffff", align: "center"});

        paddle1 = game.add.sprite(15, game.world.centerY, 'paddle1');
        paddle2 = game.add.sprite(game.width - 30, game.world.centerY, 'paddle2');

        //socket.emit('init', {sHeight: game.height, pSize: paddle1.size});

        paddle1.visible = false;
        paddle2.visible = false;
    },

    update: function() {
        if(player1Connected == true && player2Connected == true) {
            game.state.start('game');
        }
    }
}

var gameState = function(game) {};

gameState.prototype = {
    preload: function() {
        game.load.image('paddle1', 'assets/paddles/paddle1.png');
        game.load.image('paddle2', 'assets/paddles/paddle2.png');
        game.load.image('ball', 'assets/ball.png');
    },

    create: function() {
        // Fullscreen stuff
        game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.physics.arcade.checkCollision.left = false;
        game.physics.arcade.checkCollision.right = false;

        paddle1 = game.add.sprite(15, game.world.centerY, 'paddle1');
        paddle2 = game.add.sprite(game.width - 30, game.world.centerY, 'paddle2');

        game.physics.enable(paddle1, Phaser.Physics.ARCADE);
        game.physics.enable(paddle2, Phaser.Physics.ARCADE);

        paddle1.collideWorldBounds = true;
        paddle2.collideWorldBounds = true;

        paddle1.body.bounce.set(1);
        paddle2.body.bounce.set(1);

        paddle1.body.immovable = true;
        paddle2.body.immovable = true;

        ball = game.add.sprite(game.world.centerX, game.world.centerY, 'ball');
        ball.checkWorldBounds = true;
        game.physics.enable(ball, Phaser.Physics.ARCADE);
        ball.body.collideWorldBounds = true;
        ball.body.bounce.set(1);
        ball.body.velocity.y = -75;
        ball.body.velocity.x = -300;

        ball.events.onOutOfBounds.add(ballLost, this);

        wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
        sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);

        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);

        scoreText = game.add.text(game.world.centerX - 15, 5, '0 : 0', { font: "32px Arial", fill: "#ffffff", align: "center"});
    },

    update: function() {
        // Set initial velocity of paddles to 0
        //paddle1.body.velocity.setTo(0, 0);
        //paddle2.body.velocity.setTo(0, 0);

        paddle1.body.y = player1Position;
        paddle2.body.y = player2Position;

        // Move paddle1
        if(wKey.isDown) {
            paddle1.body.velocity.y = -250;
        }
        else if(sKey.isDown) {
            paddle1.body.velocity.y = 250;
        }

        // Move paddle2
        if(upKey.isDown) {
            paddle2.body.velocity.y = -250;
        }
        else if(downKey.isDown) {
            paddle2.body.velocity.y = 250;
        }


        // Keep paddle1 in bounds
        if(paddle1.y < 0) {
            paddle1.body.y = 0;
        }
        else if(paddle1.y > game.height - paddle1.height) {
            paddle1.body.y = game.height - paddle1.height;
        }

        // Keep paddle2 in bounds
        if(paddle2.y < 0) {
            paddle2.body.y = 0;
        }
        else if(paddle2.y > game.height - paddle2.height) {
            paddle2.body.y = game.height - paddle2.height;
        }

        // Collide the ball with both paddles
        game.physics.arcade.collide(ball, paddle1, null, null, this);
        game.physics.arcade.collide(ball, paddle2, null, null, this);
    },
}

function ballLost() {
    if(ball.x > game.world.centerX) {
        paddle1Score++;
    }
    else if(ball.x < game.world.centerX) {
        paddle2Score++;
    }

    scoreText.text = paddle1Score.toString() + ' : ' + paddle2Score.toString();

    ball.reset(game.world.centerX, game.world.centerY);

    // Randomize starting direction
    if((Math.floor(Math.random() * 2) + 1) == 1) {
        ball.body.velocity.y = -75;
        ball.body.velocity.x = -300;
    }
    else {
        ball.body.velocity.y = 75;
        ball.body.velocity.x = 300;
    }
}

// Socket.IO
socket.on('onconnected', function(data) {
    console.log('Connected successfully to the socket.io server. My server side ID is ' + data.id);
});

socket.on('update', function(data) {
    // Keep Player 1 in-bounds
    /*
    if(data.p1Pos < 0) {
        player1Position = 0;
    }
    else if(data.p1Pos > game.height - paddle1.height) {
        player1Position = game.height - paddle1.height;
    }
    else {
        player1Position = data.p1Pos;
    }

    // Keep Player 2 in-bounds
    if(data.p2Pos < 0) {
        player2Position = 0;
    }
    else if(data.p2Pos > game.height - paddle2.height) {
        player2Position = game.height - paddle2.height;
    }
    else {
        player2Position = data.p2Pos;
    }
    */

    player1Position = data.p1Pos;
    player2Position = data.p2Pos;
});

socket.on('p1connected', function() {
    paddle1.visible = true;
    player1Connected = true;
});

socket.on('p2connected', function() {
    paddle2.visible = true;
    player2Connected = true;
});

socket.on('playerdisconnected', function() {
    paddle1.visible = false;
    paddle2.visible = false;
    player1Connected = false;
    player2Connected = false;
    paddle1Score = 0;
    paddle2Score = 0;
    game.state.start('lobby');
});
