var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'game-div', {preload: preload, create: create, update: update});

WebFontConfig = {
    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.
    //active: function() { game.time.events.add(Phaser.Timer.SECOND, createText, this); },
    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Press+Start+2P::latin']
    }
};

var socket = io.connect('http://192.168.1.4:8001');

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

var curState;

var keyboardMode = false;

var wKey;
var sKey;
var upKey;
var downKey;
var fKey;

function preload() {
    game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
    console.log('Loaded main assets');
}

function create() {
    game.stage.backgroundColor = '#D6D29C';

    console.log('Registering lobby state');
    game.state.add('lobby', lobbyState);

    console.log('Registering main game state');
    game.state.add('game', gameState);

    if(!keyboardMode) {
        console.log('Starting lobby state');
        curState = 'lobby';
        game.state.start('lobby');
    }
    else {
        console.log('Starting main game state');
        curState = 'game';
        game.state.start('game');
    }
}

function update() {

}

//var spinners;
var lobbyBall;
var lobbyText;

var titleText1Complete = 'Programmer of 2020';
var titleText1Counter = 0;
var titleText1;

var titleText2Complete = 'Tennis for Twenty';
var titleText2Counter = 0;
var titleText2;

var timeToStart = 6;

var lobbyState = function(game) {};

lobbyState.prototype = {
    preload: function() {
        game.load.image('paddle1', 'assets/paddles/paddle1.png');
        game.load.image('paddle2', 'assets/paddles/paddle2.png');
        game.load.image('ball', 'assets/ball.png');
        //game.load.spritesheet('spinner', 'assets/spinner.png', 26, 26);
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.physics.arcade.checkCollision.left = false;
        game.physics.arcade.checkCollision.right = false;

        game.stage.backgroundColor = '#D6D29C';

        /*
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
        */

        lobbyText = game.add.text(game.world.centerX - 300, game.world.centerY, 'Waiting for Players');
        lobbyText.font = 'Press Start 2P';
        lobbyText.size = 45;
        //lobbyText.anchor.setTo(0.5);
        lobbyText.align = 'left';
        lobbyText.fill = '#858049';
        lobbyText.visible = false;

        titleText1 = game.add.text(game.world.centerX - 290, 50, '');
        titleText1.font = 'Press Start 2P';
        titleText1.size = 45;
        titleText1.align = 'left';
        titleText1.fill = '#858049';

        titleText2 = game.add.text(game.world.centerX - 285, 100, '');
        titleText2.font = 'Press Start 2P';
        titleText2.size = 45;
        titleText2.align = 'left';
        titleText2.fill = '#858049';

        game.time.events.loop(Phaser.Timer.SECOND / 8, this.updateTitleText, this);
        game.time.events.loop(Phaser.Timer.SECOND, this.updateWaitingText, this);

        paddle1 = game.add.sprite(15, game.world.centerY, 'paddle1');
        paddle2 = game.add.sprite(game.width - 30, game.world.centerY, 'paddle2');

        game.physics.enable(paddle1, Phaser.Physics.ARCADE);
        game.physics.enable(paddle2, Phaser.Physics.ARCADE);

        paddle1.collideWorldBounds = true;
        paddle2.collideWorldBounds = true;

        paddle1.body.bounce.set(1);
        paddle2.body.bounce.set(1);

        paddle1.anchor.setTo(0.5);
        paddle2.anchor.setTo(0.5);

        paddle1.body.immovable = true;
        paddle2.body.immovable = true;

        lobbyBall = game.add.sprite(game.world.centerX, game.world.centerY, 'ball');
        lobbyBall.checkWorldBounds = true;
        game.physics.enable(lobbyBall, Phaser.Physics.ARCADE);
        lobbyBall.body.collideWorldBounds = true;
        lobbyBall.body.bounce.set(1);
        lobbyBall.body.velocity.y = -75;
        lobbyBall.body.velocity.x = -300;

        lobbyBall.events.onOutOfBounds.add(lobbyBallReset, this);

        //socket.emit('init', {sHeight: game.height, pSize: paddle1.size});
    },

    update: function() {
        if(!player1Connected) {
            this.controlPaddle1();
        }
        else {
            paddle1.body.y = player1Position;
        }

        if(!player2Connected) {
            this.controlPaddle2();
        }
        else {
            paddle2.body.y = player2Position;
        }

        game.physics.arcade.collide(lobbyBall, paddle1, null, null, this);
        game.physics.arcade.collide(lobbyBall, paddle2, null, null, this);

        if(player1Connected == true && player2Connected == true) {
            //game.time.events.loop(Phaser.Timer.SECOND, this.startGame, this);
            player1Position = 0;
            player2Position = 0;
            lobbyText.visible = false;
            titleText1.setText('');
            titleText1Counter = 0;
            titleText2.setText('');
            titleText2Counter = 0;
            curState = 'game';
            game.state.start('game');
        }
    }
}

lobbyState.prototype.updateWaitingText = function() {
    /*
    if(player1Connected && player2Connected)
        return;
    */

    switch(lobbyText.text) {
        case 'Waiting for Players':
            lobbyText.setText('Waiting for Players.');
            break;
        case 'Waiting for Players.':
            lobbyText.setText('Waiting for Players..');
            break;
        case 'Waiting for Players..':
            lobbyText.setText('Waiting for Players...');
            break;
        case 'Waiting for Players...':
            lobbyText.setText('Waiting for Players');
            break;
        default:
            console.log('If you got here, then MultiVac was right');
            break;
    }
}

lobbyState.prototype.updateTitleText = function() {
    if(titleText1Counter <= titleText1Complete.length) {
        titleText1.setText(titleText1Complete.substring(0, titleText1Counter));
        ++titleText1Counter;
    }
    else if(titleText2Counter <= titleText2Complete.length) {
        titleText2.setText(titleText2Complete.substring(0, titleText2Counter));
        ++titleText2Counter;
    }
    else if(!lobbyText.visible) {
        lobbyText.visible = true;
    }
    else if(titleText2.text == titleText2Complete) {
        titleText2.setText(titleText2Complete + '|');
    }
    else if(titleText2.text == titleText2Complete + '|') {
        titleText2.setText(titleText2Complete);
    }
}

lobbyState.prototype.controlPaddle1 = function() {
    if(paddle1.body.y - lobbyBall.body.y < -5) {
        paddle1.body.velocity.y = 250;
    }
    else if(paddle1.body.y - lobbyBall.body.y > 5) {
        paddle1.body.velocity.y = -250;
    }
    else {
        paddle1.body.velocity.y = 0;
    }
}

lobbyState.prototype.controlPaddle2 = function() {
    if(paddle2.body.y - lobbyBall.body.y < -5) {
        paddle2.body.velocity.y = 250;
    }
    else if(paddle2.body.y - lobbyBall.body.y > 5) {
        paddle2.body.velocity.y = -250;
    }
    else {
        paddle2.body.velocity.y = 0;
    }
}

/*
lobbyState.prototype.startGame = function() {
    --timeToStart;

    lobbyText.setText(timeToStart.toString());

    if(timeToStart == 0) {
        player1Position = 0;
        player2Position = 0;
        lobbyText.visible = false;
        titleText1.setText('');
        titleText1Counter = 0;
        titleText2.setText('');
        titleText2Counter = 0;
        curState = 'game';
        game.state.start('game');
    }
}
*/

function lobbyBallReset() {
    lobbyBall.reset(game.world.centerX, game.world.centerY);

    if((Math.floor(Math.random() * 2) + 1) == 1) {
        lobbyBall.body.velocity.y = -75;
        lobbyBall.body.velocity.x = -300;
    }
    else {
        lobbyBall.body.velocity.y = 75;
        lobbyBall.body.velocity.x = 300;
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

        scoreText = game.add.text(game.world.centerX, 50, '0 : 0');
        scoreText.font = 'Press Start 2P';
        scoreText.fill = '#858049';
        scoreText.align = 'center';
        scoreText.anchor.setTo(0.5);
    },

    update: function() {
        // Set initial velocity of paddles to 0
        //paddle1.body.velocity.setTo(0, 0);
        //paddle2.body.velocity.setTo(0, 0);

        if(!keyboardMode) {
            paddle1.body.y = player1Position;
            paddle2.body.y = player2Position;
        }

        // Move paddle1
        if(wKey.isDown) {
            paddle1.body.velocity.y = -250;
        }
        else if(sKey.isDown) {
            paddle1.body.velocity.y = 250;
        }
        else if(!wKey.isDown && !sKey.isDown) {
            paddle1.body.velocity.y = 0;
        }

        // Move paddle2
        if(upKey.isDown) {
            paddle2.body.velocity.y = -250;
        }
        else if(downKey.isDown) {
            paddle2.body.velocity.y = 250;
        }
        else if(!upKey.isDown && !downKey.isDown) {
            paddle2.body.velocity.y = 0;
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

    if(paddle1Score == 10) {
        scoreText.setText('Player 1 Wins!')
        game.time.events.add(Phaser.Timer.SECOND * 10, resetGame, this);
    }
    else if(paddle2Score == 10) {
        scoreText.setText('Player 2 Wins!');
        game.time.events.add(Phaser.Timer.SECOND * 10, resetGame, this);
    }
    else {
        scoreText.setText(paddle1Score.toString() + ' : ' + paddle2Score.toString());

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
}

function resetGame() {
    paddle1.visible = false;
    paddle2.visible = false;
    player1Connected = false;
    player2Connected = false;
    paddle1Score = 0;
    paddle2Score = 0;

    if(curState != 'lobby') {
        curState = 'lobby';
        game.state.start('lobby');
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
    resetGame();
});
