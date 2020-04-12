//TESTING COMMIT FUNCTIONALITY

//var collisions = require("collisions");
//
const { Collisions, Polygon } = require("detect-collisions");

const system = new Collisions();

var express = require("express");
var app = express();

var server = require("http").createServer(app);
var io = require("socket.io")(server);

var physics = require("./physics");
var Puck = physics.Puck;

var abandonedChildren = [];

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});
app.use("/client", express.static(__dirname + "/client"));

console.log("Server started.");

Object.keys(io.sockets.sockets).forEach(function(s) {
  io.sockets.sockets[s].disconnect(true);
});

var ridge = {
  length: 220,
  width: 20
};

var players = {};
var lobbyMembers = {};
var speedMultiplier = 300.0;
var playerSpeed = 2;
var levelSizeX = 1000;
var levelSizeY = 550;
var puckSize = 10;
var timer = -1;
var spells = {
  ridge: "ridge",
  analogRidge: "analogRidge"
};

var speedMode = true;

var activeSpells = {};
var activeAnalogSpells = {};
var ridgeXDist = Math.sqrt(25 * 25 + 10 * 10);
var ridgeXAngle = Math.atan(10 / 25);
var rechargeSpeed = 3;
var ridgeTime = 36;
var spellIndex = 0;
var analogSpellIndex = 0;
var maxPlayers = -1;
var maxPlayersNext = -1;
var playerCount = 0;
var player1 = {};
var player2 = {};
var player3 = {};
var player4 = {};
var lobbyCount = 0;
var goalWidth = 120;
var winScore = 15;
var gameOn = false;
var win = -1;
var flags = {
  0: {
    x: 125,
    y: 275,
    team: 0,
    grabbed: false,
    scored: false
  },
  1: {
    x: 875,
    y: 275,
    team: 1,
    grabbed: false,
    scored: false
  }
};
var goals = {
  0: {
    x: 0,
    y: 0
  },
  1: {
    x: levelSizeX - goalWidth,
    y: 0
  }
};
var score = {
  0: 0,
  1: 0
};
var ID = function() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
};

io.on("connection", function(socket) {
  var sessionID = ID();
  lobbyMembers[sessionID] = {
    puck: new Puck()
  };
  socket.emit("numPlayers", maxPlayersNext.toString());
  socket.on("numPlayersChange", function(val) {
    maxPlayersNext = parseInt(val, 10);
  });
  socket.on("checkID", function(data) {
    console.log("checking");

    for (var child in abandonedChildren) {
      console.log("sessionID: " + abandonedChildren[child].id);
      console.log("data: " + data);
      if (abandonedChildren[child].id === data) {
        sessionID = abandonedChildren[child].id;
        socket.emit("playerRole", lobbyMembers[sessionID]);
        break;
      }
    }

    console.log("checkingggg");
    console.log("no id match");
    socket.emit("noIDmatch", sessionID);
  });
  socket.on("disconnect", function() {
    console.log("my id: " + socket.id);
    console.log("someone has left");
    if (lobbyMembers[sessionID]) {
      abandonedChildren.push(lobbyMembers[sessionID]);
    }
  });
  socket.on("newPlayer", function() {
    socket.emit("storeID", sessionID);
    console.log("my id: " + socket.id);
    var playerID = lobbyCount;
    var startingX = 75;
    var startingY = 275;
    lobbyMembers[sessionID] = {
      id: sessionID,
      title: "player",
      team: -1,
      playing: false,
      flagging: false,
      ready: false,
      spawnX: startingX,
      spawnY: startingY,
      x: startingX,
      y: startingY,
      prevX: 299,
      prevY: 299,
      xa: 0.0,
      ya: 0.0,
      won: false,
      aon: false,
      son: false,
      don: false,
      wclick: false,
      aclick: false,
      sclick: false,
      dclick: false,
      canBoost: true,
      holdingDownSpaceCheck: false,
      spell: "analogRidge",
      recharge: false,
      puck: new Puck(startingX, startingY, system)
    };
    socket.emit("playerRole", lobbyMembers[sessionID]);
    createPlayerLoop(lobbyMembers[sessionID]);
    console.log(sessionID);
    lobbyCount++;
  });
  socket.on("playerJoin", function() {
    var player = lobbyMembers[sessionID] || {};
    console.log("joining");
    if (playerCount === 0 || maxPlayers === -1) {
      player1 = player;
      player1.playing = true;
      player1.team = 0;
      player1.x = 75;
      player1.puck.x = 75;
      player1.spawnX = 75;
      player1.y = 200;
      player1.puck.x = 200;
      player1.spawnX = 200;
      socket.emit("setTeam", 0);
      players[0] = player1;
      playerCount++;
      //console.log("player1 has entered");
    }
    if (playerCount === 1 && !player.playing && maxPlayers === 2) {
      player2 = player;
      player2.playing = true;
      player2.team = 1;
      player2.x = 925;
      player2.puck.x = 925;
      player2.spawnX = 925;
      player2.y = 200;
      player2.puck.y = 200;
      player2.spawnY = 200;

      socket.emit("setTeam", 1);
      players[1] = player2;
      playerCount++;
      console.log("player2 has entered");
    }
    if (playerCount === 2 && !player.playing && maxPlayers === 4) {
      player3 = player;
      player3.playing = true;
      player3.team = 0;
      player3.x = 75;
      player3.puck.x = 75;
      player3.spawnX = 75;
      player3.y = 200;
      player3.puck.y = 200;
      player3.spawnY = 200;

      socket.emit("setTeam", 0);
      players[2] = player3;
      playerCount++;
      console.log("player2 has entered");
    }
    if (playerCount === 3 && !player.playing && maxPlayers === 4) {
      player4 = player;
      player4.playing = true;
      player4.team = 1;
      player4.x = 925;
      player4.puck.x = 925;
      player4.spawnX = 925;
      player4.y = 300;
      player4.puck.y = 300;
      player4.spawnY = 300;

      socket.emit("setTeam", 1);
      players[3] = player4;
      playerCount++;
      console.log("player2 has entered");
    }
  });
  socket.on("playerReady", function() {
    var player = lobbyMembers[sessionID] || {};
    if (player.team !== -1) {
      player.ready = true;
    }
    if (maxPlayers === -1) {
      gameOn = true;
    }
    var allReady = true;
    for (var id in players) {
      var playerCheck = players[id];
      if (playerCheck.ready === false) {
        allReady = false;
      }
    }
    if (Object.keys(players).length === maxPlayers && !gameOn && allReady) {
      timer = 3;
      for (var id2 in players) {
        var playerForLoad = players[id2];
        playerForLoad.x = playerForLoad.spawnX;
        playerForLoad.y = playerForLoad.spawnY;
        playerForLoad.puck.x = playerForLoad.spawnX;
        playerForLoad.puck.y = playerForLoad.spawnY;
      }

      var countdown = setInterval(function() {
        timer--;
        if (timer <= 0) {
          timer = -1;
          gameOn = true;
          clearInterval(countdown);
        }
      }, 1000);
    }
  });
  socket.on("controllerMovement", function(input) {
    var player = lobbyMembers[sessionID] || {};
    if (player.playing && gameOn) {
      //console.log(input.leftStick[0]);
      var puck = player.puck;
      puck.controllerEnabled = true;
      puck.controllerX = input.leftStick[0];
      puck.controllerY = input.leftStick[1];
      puck.braking = input.brake;
      if (!input.boost) {
        player.holdingDownSpace = false;
      }
      if (player.canBoost && input.boost && !player.holdingDownSpace) {
        puck.boosted = input.boost;
        player.holdingDownSpace = true;
        player.canBoost = false;
        setTimeout(function() {
          player.canBoost = true;
        }, 3000);
      }
    }
  });
  socket.on("movement", function(data) {
    var player = lobbyMembers[sessionID] || {};
    if (player.playing && gameOn) {
      var puck = player.puck;
      puck.aon = data.left;
      puck.won = data.up;
      puck.don = data.right;
      puck.son = data.down;
      puck.braking = data.brake;
      if (!data.boost) {
        player.holdingDownSpace = false;
      }
      if (player.canBoost && data.boost && !player.holdingDownSpace) {
        puck.boosted = data.boost;
        player.holdingDownSpace = true;
        player.canBoost = false;
        setTimeout(function() {
          player.canBoost = true;
        }, 3000);
      }
    }
  });
  socket.on("controllerSpell", function(axes) {
    if (axes[0] * axes[0] + axes[1] * axes[1] > 0.7) {
      var radAngle = Math.atan2(-axes[1], -axes[0]);
      var player = lobbyMembers[sessionID] || {};
      if (player.playing && gameOn) {
        if (player.recharge) {
          return;
        }
        if (player.spell === "analogRidge") {
          drawRidgeAnalog(player, radAngle);
        }
        player.recharge = true;
        setTimeout(function() {
          player.recharge = false;
        }, rechargeSpeed * 1000);
      }
    }
  });
  socket.on("spell", function(data) {
    if (
      !data.spellleft &&
      !data.spellup &&
      !data.spellright &&
      !data.spelldown
    ) {
      return;
    }
    var player = lobbyMembers[sessionID] || {};
    if (player.playing && gameOn) {
      if (player.recharge) {
        return;
      }
      if (player.spell === "ridge") {
        drawRidge(player, data);
      }
      player.recharge = true;
      setTimeout(function() {
        player.recharge = false;
      }, rechargeSpeed * 1000);
    }
  });
});

function drawRidgeAnalog(player, angle) {
  var x1Val = player.x + -Math.cos(angle - ridgeXAngle) * ridgeXDist;
  var x2Val = player.x + -Math.cos(angle + ridgeXAngle) * ridgeXDist;
  var y1Val = player.y + -Math.sin(angle - ridgeXAngle) * ridgeXDist;
  var y2Val = player.y + -Math.sin(angle + ridgeXAngle) * ridgeXDist;

  activeAnalogSpells[analogSpellIndex] = {
    name: "analogRidge",
    length: ridge.length,
    width: ridge.width,
    angle: angle * (180 / Math.PI) + 180,
    startX: player.y - 10,
    startY: player.x + 25,
    x1: x1Val,
    x2: x2Val,
    x3: x1Val + -(Math.cos(angle) * ridge.length),
    x4: x2Val + -(Math.cos(angle) * ridge.length),
    y1: y1Val,
    y2: y2Val,
    y3: y1Val + -(Math.sin(angle) * ridge.length),
    y4: y2Val + -(Math.sin(angle) * ridge.length),
    rotateX: player.x,
    rotateY: player.y,
    decay: new Date().getTime()
  };
  console.log(activeAnalogSpells[analogSpellIndex].angle);

  analogSpellIndex += 1;
}

function drawRidge(player, data) {
  if (data.spellup) {
    activeSpells[spellIndex] = {
      name: "ridge",
      leftX: player.x - 10,
      rightX: player.x + 10,
      bottomY: player.y - 25,
      topY: player.y - ridge.length,
      decay: new Date().getTime()
    };
    spellIndex += 1;
  } else if (data.spellleft) {
    activeSpells[spellIndex] = {
      name: "ridge",
      leftX: player.x - ridge.length,
      rightX: player.x - 25,
      bottomY: player.y + 10,
      topY: player.y - 10,
      decay: new Date().getTime()
    };
    spellIndex += 1;
  } else if (data.spellright) {
    activeSpells[spellIndex] = {
      name: "ridge",
      leftX: player.x + 25,
      rightX: player.x + ridge.length,
      bottomY: player.y + 10,
      topY: player.y - 10,
      decay: new Date().getTime()
    };
    spellIndex += 1;
  } else {
    activeSpells[spellIndex] = {
      name: "ridge",
      leftX: player.x - 10,
      rightX: player.x + 10,
      bottomY: player.y + ridge.length,
      topY: player.y + 25,
      decay: new Date().getTime()
    };
    spellIndex += 1;
  }
}

function createPlayerLoop(player) {
  var lastUpdateTime = new Date().getTime();
  setInterval(function() {
    if (!gameOn || !player.playing) {
      lastUpdateTime = new Date().getTime();
      return;
    }
    var currentTime = new Date().getTime();
    var timeDifference = currentTime - lastUpdateTime;
    var puck = player.puck;
    if (puck.controllerEnabled) {
      puck.updatePositionC(timeDifference);
    }

    var radAngle = Math.atan2(-puck.controllerX, -puck.controllerY);
    //var hypSize = puck.controllerX * puck.controllerX + puck.controllerY * puck.controllerY;
    //var angle = radAngle * (180 / Math.PI) + 180;
    //puck.checkRidgeCollisions(activeSpells);
    puck.checkAnalogRidgeCollisions2(activeAnalogSpells);

    player.x = puck.x;
    player.y = puck.y;
    //console.log(puck.x);

    lastUpdateTime = currentTime;
  }, 1000 / 60);
}

setInterval(function() {
  var hasScored = -1;
  for (var id in activeSpells) {
    var spell = activeSpells[id];
    if (spell.name === "ridge") {
      var currentTime = new Date().getTime();
      if (currentTime - spell.decay > ridgeTime * 1000) {
        delete activeSpells[id];
      }
    }
  }
  for (var aid in activeAnalogSpells) {
    var aspell = activeAnalogSpells[aid];
    if (aspell.name === "analogRidge") {
      var currentTime = new Date().getTime();
      if (currentTime - aspell.decay > ridgeTime * 1000) {
        delete activeAnalogSpells[aid];
      }
    }
  }
  for (var id in players) {
    var player = players[id];
    if (!player.id === player1.id && !player.id === player2.id) {
      continue;
    }
    if (win === -1) {
      if (player.id === player1.id || player.id === player3.id) {
        if (
          Math.abs(player.x - flags[1].x) < 23 &&
          Math.abs(player.y - flags[1].y) < 23
        ) {
          flags[1].grabbed = true;
          player.flagging = true;
        }
        if (player.x < goalWidth && player.flagging) {
          hasScored = 0;
          player.flagging = false;
          flags[1].grabbed = false;
          score[0] += 1;
          if (score[0] === winScore) {
            win = 0;
          }
        }
      } else if (player.id === player2.id || player.id === player4.id) {
        if (
          Math.abs(player.x - flags[0].x) < 23 &&
          Math.abs(player.y - flags[0].y) < 23
        ) {
          flags[0].grabbed = true;
          player.flagging = true;
        }
        if (player.x > goals[1].x && player.flagging) {
          hasScored = 1;
          player.flagging = false;
          flags[0].grabbed = false;
          score[1] += 1;
          if (score[1] >= winScore) {
            win = 1;
          }
        }
      }
    }
  }

  //console.log("info");
  /*for (var id in players) {
    console.log(players[id].id);
  }*/
  //console.log(win);

  if (maxPlayersNext !== maxPlayers && maxPlayers === -1) {
    win = 0;
  }
  if (win !== -1) {
    score[0] = 0;
    score[1] = 0;
    for (var id in players) {
      var player = players[id];
      player.playing = false;
      player.team = -1;
      player.flagging = false;
      player.ready = false;
      player.x = player.spawnX;
      player.y = player.spawnY;
      player.puck.y = player.spawnX;
      player.puck.y = player.spawnY;
      var puck = player.puck;
      puck.xa = 0.0;
      puck.ya = 0.0;
      puck.aon = false;
      puck.won = false;
      puck.don = false;
      puck.son = false;
    }
    flags[0].grabbed = false;
    flags[1].grabbed = false;
    player1 = {};
    player2 = {};
    player3 = {};
    player4 = {};
    players = {};
    playerCount = 0;
    gameOn = false;
    maxPlayers = maxPlayersNext;
    setTimeout(function() {
      win = -1;
    }, 3000);
  }

  //console.log()
  io.sockets.emit(
    "state",
    players,
    activeSpells,
    activeAnalogSpells,
    flags,
    goals,
    hasScored,
    score,
    win,
    player1.id,
    player2.id,
    player3.id,
    player4.id,
    timer,
    gameOn
  );
  hasScored = -1;
}, 1000 / 60);

server.listen(4141);
