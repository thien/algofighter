// include dependencies
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

var data = {
    "bot": [],
    "projectile": []
};
var clients = [];
var Pi = Math.PI;
var cmndList = ['JMP',
    'MVX',
    'MVY',
    'ROT',
    'SHT',
    'HLT',
    'PSS',
    'REG',
    'IR0',
    'ADD',
    'SET',
    'LOK',
    'MDR'
];

function Bot(clientId, x, y, botName, code) {

    //
    // robot object
    //

    //name of client associated with robot
    this.clientId = clientId;
    //name of robot
    this.botName = botName;
    //robot positions
    this.x = x;
    this.y = y;
    //robot rotation
    this.angle = 0;
    //code assigned to this robot
    this.code = code;
    //initiate random colour allocation for bot
    this.color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    //score allocation
    this.score = 0;
    //individual time control for each bot. (DON'T CHANGE!)
    this.turnsTillShot = 5;
    this.pc = 0; // program counter
    this.reg = 0; // registers
    this.exec = function() {
        //executes bots code
        try {
            if (this.pc > -1) {
                execAssembly(this.clientId, this.code[this.pc][0], this.code[this.pc][1]);
                this.pc += 1;
                io.sockets.connected[clientId].emit('compile-error', "");
            }
        } catch (err) {
            console.log(err);
            io.sockets.connected[clientId].emit('compile-error', "Could not execute instruction at or immediately after line " + this.pc);
            this.pc = -2;
        }
    }
}

function Projectile(clientId, x, y, angle) {

    //
    // projectile object
    //

    this.clientId = clientId;
    this.x = x;
    this.y = y;
    this.angle = angle;
}

function indexCommand(inputCmnd) {
    //check a command written in the user's program is a valid command.
    for (validCmnd in cmndList) {
        if (cmndList[validCmnd] == inputCmnd) {
            return validCmnd;
        }
    }
    return cmndList.length
}

function validateList(input) {
    //check the users program to determine whether to run a valid command or not.
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
    //initiates commands.
    switch (cmnd) {
        case 0: //jmp
            // Jump to executing line address
            var bot = getBot(clientId);
            bot.pc = val - 1;
            break;
        case 1: //mvx
            //  Move distance pixels to the right
            moveBot(clientId, val, 0);
            break;
        case 2: //mvy
            // Move distance pixels down
            moveBot(clientId, 0, val);
            break;
        case 3: //rot
            // move angle degrees clockwise
            rotateBot(clientId, val / 360 * 2 * Pi);
            break;
        case 4: //sht
            // makes bot shoot.
            botShoot(clientId);
            break;
        case 5: //hlt
            // halts execution
            var bot = getBot(clientId);
            bot.pc = -2;
            break;
        case 6: //pss
            // do nothing
            break;
        case 7: //reg
            // initiates a register
            var bot = getBot(clientId);
            bot.reg = val;
            break;
        case 8: //ir0
            // If the value of the register is zero, JMP to address
            var bot = getBot(clientId);
            if (bot.reg == 0) {
                bot.pc = val - 1;
            }
            break;
        case 9: //add
            // Add value to the register
            var bot = getBot(clientId);
            bot.reg += val;
            break;
        case 10: //set
            //  Set the register to be value
            var bot = getBot(clientId);
            bot.reg = val;
            break;
        case 11: //lok
            // Point towards a random enemy
            if (data["bot"].length > 1) {
                var bot = getBot(clientId);
                var randomBot = bot;
                while (randomBot == bot) {
                    // chooses a random enemy from the list of bots on the map (that's not itself)
                    randomBot = getBot(data["bot"][randInt(0, data["bot"].length - 1)]["clientId"]);
                }
                // calculates the angle from bot toward enemy.
                //
                bot.angle = Math.atan((-randomBot["x"] + bot["x"]) / (randomBot["y"] - bot["y"]));
                if (bot["y"] - randomBot["y"] < 0) {
                    bot.angle += Pi;
                }
            }
            break;
        case 12: //mdr
            // Move distance pixels forwards
            var bot = getBot(clientId);
            bot["x"] += val * Math.sin(bot["angle"]);
            bot["y"] -= val * Math.cos(bot["angle"]);
            break;
        default:
            // unrecognised instruction
            console.log("Unrecognised Instruction: " + cmnd + " with val: " + val)
    }
}

function botShoot(clientId) {
    var bot = getBot(clientId);
    if (bot["turnsTillShot"] == 0) {
        // add projectile and its associations to list
        data["projectile"].push(new Projectile(clientId, bot["x"] + 5, bot["y"] + 5, bot["angle"] - Pi / 2));
        // reset the timeout until the bot can shoot next.
        bot["turnsTillShot"] = 5;
    }
}

function moveBot(clientId, distanceX, distanceY) {
    //moves bot.
    var i = 0;
    while (i < data["bot"].length) {
        if (data["bot"][i]["clientId"] == clientId) {
            //check if bot is inside the arena before adjusting position
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

function rotateBot(clientId, degree) {
    //rotates the bot.
    var i = 0;
    while (i < data["bot"].length) {
        //check if id matches.
        if (data["bot"][i]["clientId"] == clientId) {
            //add rotation (in degrees) to bot.
            data["bot"][i]["angle"] = data["bot"][i]["angle"] + degree;
            //check if current degree > 360
            if (data["bot"][i]["angle"] >= 2 * Pi) {
                data["bot"][i]["angle"] = data["bot"][i]["angle"] - 2 * Pi;
            }
            //check if current degree < 360
            else if (data["bot"][i]["angle"] < 0) {
                data["bot"][i]["angle"] = data["bot"][i]["angle"] + 2 * Pi;
            }
            return true;
        }
        i++;
    }
}

<<<<<<< HEAD
=======
//Server goodness
server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

//Routing
app.use('/', express.static('public'));

>>>>>>> origin/master
function deleteClient(clientId) {
    //removes socket from list of players.
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
    //removes robot associated with a clientID.
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
    //checks if a user has a bot associated with it.
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
    //gets the bot associated with a client.
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
    //gets the index value of a particular client's bot.
    var i = 0;
    while (i < data["bot"].length) {
        if (data["bot"][i]["clientId"] == clientId) {
            return i;
        }
        i++;
    }
    return false;
}

function updateProjectiles() {
    //updates the positions of the projectiles
    for (i = 0; i < data["projectile"].length; i++) {
        //Updates positions of projectiles
        data["projectile"][i]["x"] += 5 * Math.cos(data["projectile"][i]["angle"]);
        data["projectile"][i]["y"] += 5 * Math.sin(data["projectile"][i]["angle"]);
        //Deletes if they go off the screen
        if ((data["projectile"][i]["x"] > 1000) ||
            (data["projectile"][i]["x"] < 0) ||
            (data["projectile"][i]["y"] < 0) ||
            (data["projectile"][i]["y"] > 500)) {
            data["projectile"].splice(i, 1);
        }
    }
}

function updateCollisions() {
    for (i = 0; i < data["projectile"].length; i++) {
        for (j = 0; j < data["bot"].length; j++) {
            // check if a robot has been hit by a projectile

            //check if a bots x coordinate is less than a projectiles x coordinate
            //checks if a projectile's x coordinate is less than
            if (
                    (data["bot"][j]["x"] - 6        < data["projectile"][i]["x"])
                && ((data["projectile"][i]["x"])    < (data["bot"][j]["x"] + 6))
                &&  (data["bot"][j]["y"] - 6        < data["projectile"][i]["y"])
                && ((data["projectile"][i]["y"])    < (data["bot"][j]["y"] + 6))
                &&  (data["bot"][j]["clientId"] != data["projectile"][i]["clientId"]))
                {
                if (hasBot(data["projectile"][i]["clientId"])) {
                    data["bot"][getBotIndex(data["projectile"][i]["clientId"])]["score"] += 1 + data["bot"][j]["score"]
                }
                data["projectile"].splice(i, 1);
                data["bot"].splice(j, 1);
            }
        }
    }
}



function updateBoardTick() {
    //updates the ticks (actions are performed every tick)
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
    //generates a random integer between a range.
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


//Server goodness
server.listen(port, function() {
    console.log('Server listening at http://52.49.29.249/ port %d', port);
});

//Routing
app.use('/', express.static('public'));

//Socket Goodness
io.on('connection', function(socket) {
    console.log('A user has connected');
    clients.push(socket.id);
    socket.on('code submission', function(name, code) {
        if (hasBot(socket.id)) {
            //removes bot if the user has one generated already.
            deleteBot(socket.id);
        }
        console.log("Creating new bot " + name);
        //split users code by line
        code = code.split("\n");
        //add bot to the list.
        data["bot"].push(new Bot(socket.id, randInt(0, 999), randInt(0, 499), name, validateList(code)));
    });
    socket.on('disconnect', function() {
        console.log('user disconnected');
        deleteBot(socket.id);
        deleteClient(socket.id);
    });
});

<<<<<<< HEAD
setInterval(updateBoardTick, 50);
=======
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
		  if ((typeof data["bot"][j] !== "undefined") && (typeof data["projectile"][i] !== "undefined") ) {
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
>>>>>>> origin/master
