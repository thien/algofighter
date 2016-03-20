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
    //this.code = codeFunc;
    this.code = code;
    this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
}

function moveBot(clientId,distanceX,distanceY) {
  var i = 0;
  while (i < data["bot"].length) {
    if (data["bot"][i]["clientId"] == clientId) {
      if ((data["bot"][i]["x"] + distanceX < 1000) && (data["bot"][i]["x"] + distanceX > 0)) {
	data["bot"][i]["x"] += distanceX;
      }
      if ((data["bot"][i]["y"] + distanceY < 500) && (data["bot"][i]["y"] + distanceY > 0)) {
	data["bot"][i]["y"] += distanceY;
      }
      return true;
    }
    i++;
  }  
}

function rotateBot(clientId,degrees) {
  var i = 0;
  while (i < data["bot"].length) {
      if (data["bot"][i]["clientId"] == clientId) {
	data["bot"][i]["angle"] = data["bot"][i]["angle"] + degrees;
	if (data["bot"][i]["angle"] >= 360) {
	  data["bot"][i]["angle"] = data["bot"][i]["angle"] - 360;
	} else if (data["bot"][i]["angle"] < 0) {
	  data["bot"][i]["angle"] = data["bot"][i]["angle"] + 360;
	}
	return true;
      }
      i++;
  }
}

//Server goodness
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

//Routing
app.use('/', express.static('public'));

function deleteClient(clientId) {
  var i = 0;
  var removed = false;
  while ((i < clients.length) && (!removed)) {
    if (clients[i] == clientId) {
      clients.splice(i,1);
      removed = true;
      return true;
    }
    i++;
  }
}

function deleteBot(clientId) {
  var i = 0;
  removed = false;
  while ((i < data["bot"].length) && (!removed)) {
    if (data["bot"][i]["clientId"] == clientId) {
      data["bot"].splice(i,1);
      removed = true;
      return true;
    }
    i++;
  }
}

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
    //tempString = "function codeFunc() {" + code + "}";
    //console.log(tempString);
    //eval(tempString);
    //eval("function codeFunc() " + code);
    if (hasBot(socket.id)) {
      deleteBot(socket.id);
    }
    console.log("Creating new bot "+code);
    data["bot"].push(new Bot(socket.id,randInt(0,999),randInt(0,499),name,code));
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
    deleteBot(socket.id);
    deleteClient(socket.id);
  });
});

function updateBoardTick() {
  // console.log(data);
  for (i = 0; i < data["bot"].length; i++) {
    botClientId = data["bot"][i]["clientId"];
    moveBot(botClientId,randInt(-10,10),randInt(-10,10));
    rotateBot(botClientId,randInt(-20,20));
  }
  io.sockets.emit('board-update', data);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(updateBoardTick,100);
