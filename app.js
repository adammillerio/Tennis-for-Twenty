/*
  A note on compatability:

  Many tutorials use Express 2.0 which is depracated
  Socket.io requires an http instance to listen on
  but Express 3.0 no longer uses http, therfore, you
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
var player1Position = 0;
var player2Position = 0;

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

io.sockets.on('connection', function(client) {
    if(screenUUID == undefined) {
      client.userid = UUID();
      screenUUID = client.userid;
      console.log(':: socket.io :: screen connected with UUID ' + client.userid);
    }
    else if(player1UUID != undefined && player2UUID != undefined && screenUUID != undefined) {
      client.emit('gamefull');
    }
    else {
      client.userid = UUID();
      if(player1UUID == undefined) {
        player1UUID = client.userid;
        player1Position = 360;
        io.sockets.emit('p1connected');
      }
      else if(player2UUID == undefined) {
        player2UUID = client.userid;
        player2Position = 360;
        io.sockets.emit('p2connected');
      }

      client.emit('onconnected', {id: client.userid});

      console.log(':: socket.io :: player connected with UUID ' + client.userid);

      client.on('disconnect', function() {
        console.log(':: socket.io :: client disconnected with UUID' + client.userid);
        player1UUID = undefined;
        player2UUID = undefined;
        io.sockets.emit('playerdisconnected');
      });

      client.on('updateposition', function(pos) {
        if(client.userid == player1UUID) {
          player1Position += pos;
        }
        else if(client.userid == player2UUID) {
          player2Position += pos;
        }
        io.sockets.emit('update', {p1Pos: player1Position, p2Pos: player2Position});

        //console.log(player1Position);
        //console.log(player2Position);
      });
    }
});
