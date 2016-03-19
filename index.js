var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;
var code = [];
var data = {"bot":[],"projectile":[]};
var clients = []

function Bot (clientId,x,y,botName,code) {
    this.clientId = clientId;
    this.botName = botName;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.code = code;
    this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
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
  clients.push(socket.id);
  socket.on('code submission', function(code){
  	console.log(code);
  	console.log('bot name: ' + code[0]);
    console.log('code submitted: ' + code[1]);
    addBot(socket.id,randInt(0,999),randInt(0,499),code[0],code[1]);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
    clients.splice(array.indexOf(socket.id),1);
  });
});

function addBot(x,y) {
  data["bot"].push(new Bot(x,y));
}

function updateBoardTick() {
  // console.log(data);
  io.sockets.emit('board-update', data);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(updateBoardTick,100);
