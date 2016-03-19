var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;
var data = {};


//Server goodness
server.listen(port, function () {
  console.log('Server listening at port %d', port);
  data = {"bot":[{"x":800,"y":10},{"x":50,"y":50},{"x":20,"y":200}],"projectile":[{"x":70,"y":70}]};
});

//Routing
app.use('/', express.static('public'));

//Socket Goodness
io.on('connection', function(socket){
  console.log('A user has connected');
  socket.on('code submission', function(code){
    console.log('code submitted: ' + code);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});
