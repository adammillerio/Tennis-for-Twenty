/*
  A note on compatability:

  Many tutorials use Express 2.0 which is deprecated
  Socket.io requires an http instance to listen on
  but Express 3.0 no longer uses http, therefore, you
  must first create the http instance.
*/

var express = require('express'),
  http = require('http'),
  UUID = require('node-uuid'),
  gameport = 8001,
  verbose = true;

var app = express();
var server = http.createServer(app);

var player1UUID;
var player2UUID;
var screenUUID;
var player1Position = 360;
var player2Position = 360;

var screenHeight = 720;
var paddleSize = 48;

var io = require('socket.io').listen(server);

server.listen(gameport);

console.log(':: Express :: Listening on port ' + gameport);

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/*', function(req, res, next) {
  var file = req.params[0];

  if(verbose) console.log(':: Express :: file requested: ' + file);

  res.sendfile(__dirname + '/' + file);
});

// Configure the socket.io connection settings
io.configure(function() {
  io.set('log level', 0);

  io.set('authorization', function (handshakeData, callback) {
    callback(null,true);
  });
});

// Assigning different functions based on emitted states as well as assigning UUIDs
io.sockets.on('connection', function(client) {
    // Make sure the server remembers who is who
    if(screenUUID == undefined) {
      client.userid = UUID();
      screenUUID = client.userid;
      console.log(':: socket.io :: screen connected with UUID ' + client.userid);
    }
    // Prevent extra dials from connecting
    else if(player1UUID != undefined && player2UUID != undefined && screenUUID != undefined) {
      client.emit('gamefull');
    }
    else {
      client.userid = UUID();
      // Player 1 is joining
      if(player1UUID == undefined) {
        player1UUID = client.userid;
        io.sockets.emit('p1connected');
      }
      // Player 2 is joining
      else if(player2UUID == undefined) {
        player2UUID = client.userid;
        io.sockets.emit('p2connected');
      }

      // Send back onconnected so that the clients can act on it
      client.emit('onconnected', {id: client.userid});

      console.log(':: socket.io :: player connected with UUID ' + client.userid);

      /*
      client.on('init', function(data) {
        console.log('hi');

        if(client.userid == screenUUID) {
          screenHeight = data.sHeight;
          player1Position = screenHeight / 2;
          player2Position = screenHeight / 2;
          paddleSize = data.pSize;

          console.log(':: socket.io :: Screen height is: ' + screenHeight + 'and paddle size is: ' + paddleSize);
        }
      });
      */

      // If one client disconnects, disconnect both and return to lobby
      client.on('disconnect', function() {
        console.log(':: socket.io :: client disconnected with UUID' + client.userid);
        player1UUID = undefined;
        player2UUID = undefined;
        io.sockets.emit('playerdisconnected');
      });

      // Updating the client's position
      client.on('updateposition', function(pos) {
        if(client.userid == player1UUID) {
          if(player1Position + pos < 0) {
            player1Position = 0;
          }
          else if(player1Position + pos > screenHeight - paddleSize) {
            player1Position = screenHeight - paddleSize;
          }
          else {
            player1Position += pos;
          }
        }
        else if(client.userid == player2UUID) {
          if(player2Position + pos < 0) {
            player2Position = 0;
          }
          else if(player2Position + pos > screenHeight - paddleSize) {
            player2Position = screenHeight - paddleSize;
          }
          else {
            player2Position += pos;
          }
        }

        // Let the screen handle position updates
        io.sockets.emit('update', {p1Pos: player1Position, p2Pos: player2Position});

        //console.log(player1Position);
        //console.log(player2Position);
      });
    }
});
