var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;
var data = {"bot":[],"projectile":[]};
var clients = []

function Bot (clientId,x,y,botName,code) {
    this.clientId = clientId;
    this.botName = botName;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.code = codeFunc;
    this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
}

//Server goodness
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

//Routing
app.use('/', express.static('public'));

function hasBot(clientId) {
  var i = 0;
  while (i < data["bot"].length) {
    if (data["bot"][i]["clientId"] == clientId) {
      return true;
    }
    i++;
  }
  return false;
}

//Socket Goodness
io.on('connection', function(socket){
  console.log('A user has connected');
  clients.push(socket.id);
  socket.on('code submission', function(name,code){
    console.log("Creating new bot "+code);
    
    // !!MAJOR SECURITY RISK!!
    tempString = "function codeFunc() " + code;
    console.log(tempString);
    eval("function codeFunc() " + code);
    if (!hasBot(socket.id)) {
      console.log("Creating new bot "+code);
      data["bot"].push(new Bot(socket.id,randInt(0,999),randInt(0,499),name,code));
    } else {
      console.log("User tried to recreate a bot.");
    }
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
    var index = array.indexOf(socket.id)
    if (index > -1) {
      clients.splice(index,1);
    }
  });
});

function updateBoardTick() {
  // console.log(data);
  for (i = 0; i < data["bot"].length; i++) {
  	data["bot"][i].code();
  }
  io.sockets.emit('board-update', data);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(updateBoardTick,100);
