var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;
var data = {};

function Bot (x,y) {
    this.x = x;
    this.y = y;
}

//Server goodness
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

//Routing
app.use('/', express.static('public'));

//Socket Goodness
io.on('connection', function(socket){
  console.log('A user has connected');
  socket.on('code submission', code, function(){
    console.log('code submitted: ' + code);
    addBot(randInt(0,999),randInt(0,499));
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

function addBot(x,y) {
  data.push(new Bot(x,y));
}

function updateBoardTick() {
  io.emit('board update', data);  
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(updateBoardTick,1000);