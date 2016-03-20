var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;
var data = {
    "bot": [],
    "projectile": []
};
var clients = []
var PI = Math.PI;
cmndList = ['JMP', 'MVX', 'MVY', 'ROT', 'SHT','HLT','PSS', 'REG', 'IR0', 'ADD', 'SET', 'LOK','MDR']

function Bot(clientId, x, y, botName, code) {
    this.clientId = clientId;
    this.botName = botName;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.code = code;
    this.color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    this.score = 0;
    this.turnsTillShot = 5;
    this.pc = 0; //program counter
    this.reg = 0;
    this.exec = function () {
      try {
	if (this.pc > -1) {
	  execAssembly(this.clientId,this.code[this.pc][0],this.code[this.pc][1]);
	  this.pc+= 1;
	  io.sockets.connected[clientId].emit('compile-error',"");
	}
      } catch(err) {
	console.log(err);
	io.sockets.connected[clientId].emit('compile-error',"Could not execute instruction at or immediately after line "+this.pc);
	this.pc = -2;
      }
    }
}

function Projectile(clientId, x, y, angle) {
    this.clientId = clientId;
    this.x = x;
    this.y = y;
    this.angle = angle;
}

function indexCommand(inputCmnd) {
    for (validCmnd in cmndList) {
        if (cmndList[validCmnd] == inputCmnd) {
            return validCmnd;
        }
    }
    return cmndList.length
}

function validateList(input) {
    instructionList = [];
    for (line in input) {
        var params = input[line].split(" ")
        var index = indexCommand(params[0])
        if (index != cmndList.length) {
            instructionList.push([parseInt(index), parseInt(params[1])])
        } else {
            instructionList.push(false);
        }
    }
    return instructionList;
}

function execAssembly(clientId, cmnd, val) {
    switch (cmnd) {
        case 0: //jmp
            var bot = getBot(clientId);
            bot.pc = val-1;
            break;
        case 1: //mvx
            moveBot(clientId, val, 0);
            break;
        case 2: //mvy
            moveBot(clientId, 0, val);
            break;
        case 3: //rot
            rotateBot(clientId, val/360 * 2*PI);
            break;
        case 4: //sht
            botShoot(clientId);
            break;
	case 5: //hlt
	    var bot = getBot(clientId);
            bot.pc = -2;
	    break;
	case 6: //pss
	    break;
	case 7: //reg
	    var bot = getBot(clientId);
	    bot.reg = val;
	    break;
	case 8: //ir0
	    var bot = getBot(clientId);
	    if (bot.reg == 0) {
	      bot.pc = val-1;
	    }
	    break;
	case 9: //add
	    var bot = getBot(clientId);
	    bot.reg += val;
	    break;
	case 10: //set
	    var bot = getBot(clientId);
	    bot.reg = val;
	    break;
	case 11: //lok
	    if (data["bot"].length > 1) {
	      var bot = getBot(clientId);
	      var randomBot = bot;
	      while (randomBot == bot) {
		randomBot = getBot(data["bot"][randInt(0,data["bot"].length-1)]["clientId"]);
	      }
	      var angle = Math.atan((-randomBot["x"]+bot["x"])/(randomBot["y"]-bot["y"]));
	      bot.angle = angle;
	      if (bot["y"]-randomBot["y"] < 0) {
		bot.angle += PI;
	      }
	    }
	    break;
	case 12: //mdr
	    var bot = getBot(clientId);
	    bot["x"] += val*Math.sin(bot["angle"]);
	    bot["y"] -= val*Math.cos(bot["angle"]);
	    break;
        default:
            console.log("Unrecognised Instruction: " + cmnd + " with val: " + val)
    }
}


function botShoot(clientId) {
    var bot = getBot(clientId);
    if (bot["turnsTillShot"] == 0) {
        data["projectile"].push(new Projectile(clientId, bot["x"] + 5, bot["y"] + 5, bot["angle"] - PI / 2));
        bot["turnsTillShot"] = 5;
    }
}

function moveBot(clientId, distanceX, distanceY) {
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

function rotateBot(clientId, rad) {
    var i = 0;
    while (i < data["bot"].length) {
        if (data["bot"][i]["clientId"] == clientId) {
            data["bot"][i]["angle"] = data["bot"][i]["angle"] + rad;
            if (data["bot"][i]["angle"] >= 2 * PI) {
                data["bot"][i]["angle"] = data["bot"][i]["angle"] - 2 * PI;
            } else if (data["bot"][i]["angle"] < 0) {
                data["bot"][i]["angle"] = data["bot"][i]["angle"] + 2 * PI;
            }
            return true;
        }
        i++;
    }
}

//Server goodness
server.listen(port, function() {
    console.log('Server listening athttp://52.49.29.249/ port %d', port);
});

//Routing
app.use('/', express.static('public'));

function deleteClient(clientId) {
    var i = 0;
    var removed = false;
    while ((i < clients.length) && (!removed)) {
        if (clients[i] == clientId) {
            clients.splice(i, 1);
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
            data["bot"].splice(i, 1);
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

function getBot(clientId) {
    var i = 0;
    while (i < data["bot"].length) {
        if (data["bot"][i]["clientId"] == clientId) {
            return data["bot"][i];
        }
        i++;
    }
    return false;
}

function getBotIndex(clientId) {
    var i = 0;
    while (i < data["bot"].length) {
        if (data["bot"][i]["clientId"] == clientId) {
            return i;
        }
        i++;
    }
    return false;
}

//Socket Goodness
io.on('connection', function(socket) {
    console.log('A user has connected');
    clients.push(socket.id);
    socket.on('code submission', function(name, code) {
        if (hasBot(socket.id)) {
            deleteBot(socket.id);
        }
        console.log("Creating new bot " + name);
        code = code.split("\n");
        data["bot"].push(new Bot(socket.id, randInt(0, 999), randInt(0, 499), name, validateList(code)));
    });
    socket.on('disconnect', function() {
        console.log('user disconnected');
        deleteBot(socket.id);
        deleteClient(socket.id);
    });
});

function updateProjectiles() {
	for (i = 0; i < data["projectile"].length; i++) {
  	//Updates positions of projectiles
    data["projectile"][i]["x"] += 5*Math.cos(data["projectile"][i]["angle"]);
    data["projectile"][i]["y"] += 5*Math.sin(data["projectile"][i]["angle"]);
    //Deletes if they go off the screen
    if ((data["projectile"][i]["x"] > 1000) || (data["projectile"][i]["x"] < 0) || (data["projectile"][i]["y"] < 0) || (data["projectile"][i]["y"] > 500))  {
      data["projectile"].splice(i,1);
    }
  }
}

function updateCollisions() {
	for (i = 0; i < data["projectile"].length; i++) {
		for (j = 0; j < data["bot"].length; j++) {
    		if ((data["bot"][j]["x"]-6 < data["projectile"][i]["x"]) && ((data["projectile"][i]["x"]) < (data["bot"][j]["x"]+6))
    		&&  (data["bot"][j]["y"]-6 < data["projectile"][i]["y"]) && ((data["projectile"][i]["y"]) < (data["bot"][j]["y"]+6))
    		&& 	(data["bot"][j]["clientId"] != data["projectile"][i]["clientId"])) {
			if (hasBot(data["projectile"][i]["clientId"])) {
			  data["bot"][getBotIndex(data["projectile"][i]["clientId"])]["score"] += 1 + data["bot"][j]["score"]    
			}
    			data["projectile"].splice(i,1);
    			data["bot"].splice(j,1);    			
    		}
    	}
	}
}

function updateBoardTick() {
  for (i = 0; i < data["bot"].length; i++) {
      botClientId = data["bot"][i]["clientId"];
      if (data["bot"][i]["turnsTillShot"] > 0) {
	  data["bot"][i]["turnsTillShot"] -= 1;
      }
      data["bot"][i].exec();
  }
  updateProjectiles();
  updateCollisions();
  io.sockets.emit('board-update', data);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(updateBoardTick, 50);
