var socket = io();

if (!!navigator.getGamepads) {
  //console.log("GAMEPAD FUNCTIONALITY");
}

window.activeGamepadNum = 0;

$("#gamepad_select").on("change", function(e) {
  window.activeGamepadNum = e.target.value;
});

$("#numplayers_select").on("change", function(e) {
  socket.emit("numPlayersChange", $("#numplayers_select").val());
});

socket.on("numPlayers", function(numPlayers) {
  $("#numplayers_select").val(numPlayers);
});

var numGamepads = 0;
window.addEventListener("gamepadconnected", function(e) {
  var placeholder = document.getElementById("gamepad_placeholder");
  var gamepadSelect = document.getElementById("gamepad_select");
  var optionNode = document.createElement("option");
  var textnode = document.createTextNode(e.gamepad.id);
  optionNode.setAttribute("value", numGamepads++);
  optionNode.appendChild(textnode);
  gamepadSelect.appendChild(optionNode);
  gamepadSelect.removeChild(placeholder);
});

var controllerToggle = true;

var chatText = document.getElementById("chat-text");
var chatInput = document.getElementById("chat-input");
var chatForm = document.getElementById("chat-form");

var localID = 0;

const joinButton = document.querySelector("#join_button");
const readyButton = document.querySelector("#ready_button");

function getCookie(name) {
  // Split cookie string and get all individual name=value pairs in an array
  var cookieArr = document.cookie.split(";");

  //console.log(cookieArr);
  // Loop through the array elements
  for (var i = 0; i < cookieArr.length; i++) {
    var cookiePair = cookieArr[i].split("=");

    /* Removing whitespace at the beginning of the cookie name
      and compare it with the given string */
    if (name === cookiePair[0].trim()) {
      // Decode the cookie value and return
      return decodeURIComponent(cookiePair[1]);
    }
  }

  // Return null if not found
  return null;
}

socket.on("storeID", function(data) {
  localID = data;
  //document.cookie = "rollerballID=1; path=/";
  document.cookie = "rollerballID=" + data;
  //.log(document.cookie);
});

joinButton.onclick = function(e) {
  e.preventDefault();
  //console.log("clicked");
  socket.emit("playerJoin");
};
readyButton.onclick = function(e) {
  e.preventDefault();
  //console.log("ready");
  if (team !== -1) {
    socket.emit("playerReady");
  }
};

localID = getCookie("rollerballID");
if (localID) {
  //console.log("checking an old ID");
  socket.emit("checkID", localID);
} else {
  //console.log("no ID stored");
  socket.emit("newPlayer");
}

socket.on("noIDmatch", function(data) {
  //console.log("repeatedly running noIDmatch");
  document.cookie = "rollerballID=" + data;
  //document.cookie += ";rollerballID=" + 1 + "; path=/";
  socket.emit("newPlayer");
});

window.onbeforeunload = function(e) {
  // Cancel the event
  //e.preventDefault();
  // Chrome requires returnValue to be set
  //e.returnValue = "Really want to quit the game?";
};

//Prevent Ctrl+S (and Ctrl+W for old browsers and Edge)
document.onkeydown = function(e) {
  e = e || window.event; //Get event

  if (!e.ctrlKey) return;

  var code = e.which || e.keyCode; //Get key code

  switch (code) {
    case 83: //Block Ctrl+S
    case 87: //Block Ctrl+W -- Not work in Chrome and new Firefox
      e.preventDefault();
      e.stopPropagation();
      break;
    default:
      break;
  }
};

//add a chat cell to our chat list view, and scroll to the bottom
socket.on("addToChat", function(data) {
  //console.log("got a chat message");
  chatText.innerHTML += '<div class="chatCell">' + data + "</div>";
  chatText.scrollTop = chatText.scrollHeight;
});

var movement = {
  up: false,
  down: false,
  left: false,
  right: false,
  brake: false,
  boost: false
};
var spell = {
  spellup: false,
  spelldown: false,
  spellleft: false,
  spellright: false
};

var input = {
  up: false,
  down: false,
  left: false,
  right: false,
  spellup: false,
  spelldown: false,
  spellleft: false,
  spellright: false,
  brake: false,
  boost: false,
  leftStick: [],
  rightStick: []
};

var socketPlayer = -1;
var team = -1;

document.addEventListener("keydown", function(event) {
  switch (event.keyCode) {
    case 83: // S
      event.preventDefault();
      input.left = true;
      break;
    case 69: // E
      event.preventDefault();
      input.up = true;
      break;
    case 70: // F
      event.preventDefault();
      input.right = true;
      break;
    case 68: // D
      event.preventDefault();
      input.down = true;
      break;
    case 37: // A
      event.preventDefault();
      input.spellleft = true;
      break;
    case 38: // W
      event.preventDefault();
      input.spellup = true;
      break;
    case 39: // D
      event.preventDefault();
      input.spellight = true;
      break;
    case 40: // S
      event.preventDefault();
      input.spelldown = true;
      break;
    case 16:
      event.preventDefault();
      input.brake = true;
      break;
    case 32:
      event.preventDefault();
      input.boost = true;
      break;
    default:
      break;
  }
});
document.addEventListener("keyup", function(event) {
  event.preventDefault();
  switch (event.keyCode) {
    case 83: // A
      event.preventDefault();
      input.left = false;
      break;
    case 69: // W
      event.preventDefault();
      input.up = false;
      break;
    case 70: // D
      event.preventDefault();
      input.right = false;
      break;
    case 68: // S
      event.preventDefault();
      input.down = false;
      break;
    case 37: // A
      event.preventDefault();
      input.spellleft = false;
      break;
    case 38: // W
      event.preventDefault();
      input.spellup = false;
      break;
    case 39: // D
      event.preventDefault();
      input.spellright = false;
      break;
    case 40: // S
      event.preventDefault();
      input.spelldown = false;
      break;
    case 16:
      event.preventDefault();
      input.brake = false;
      break;
    case 32:
      event.preventDefault();
      input.boost = false;
      break;
    default:
      break;
  }
});

setInterval(function() {
  if (controllerToggle) {
    var gamepad = navigator.getGamepads()[window.activeGamepadNum];
    if (gamepad) {
      //console.log("{x: " + gamepad.axes[2] + " ,y: " + gamepad.axes[5] + "}");
    }
    input.leftStick = gamepad.axes.slice(0, 2);
    input.rightStick = gamepad.axes.slice(2);
    if (gamepad.buttons[6].value > 0.5) {
      input.brake = true;
    } else {
      input.brake = false;
    }
    if (gamepad.buttons[7].value > 0.5) {
      input.boost = true;
    } else {
      input.boost = false;
    }
    socket.emit("controllerMovement", input);
    socket.emit("controllerSpell", input.rightStick);
  } else {
    socket.emit("movement", input);
    socket.emit("spell", spell);
  }
}, 1000 / 60);

socket.on("playerRole", function(data) {
  socketPlayer = data.id;
});

socket.on("setTeam", function(data) {
  //console.log("team: " + data);
  team = data;
  //console.log("socketplayer: " + socketPlayer);
});

var canvas = document.getElementById("canvas");
canvas.width = 1000;
canvas.height = 550;
var context = canvas.getContext("2d");
socket.on("state", function(
  players,
  AS,
  AAS,
  flags,
  goals,
  hasScored,
  score,
  win,
  p1,
  p2,
  p3,
  p4,
  timer,
  gameOn
) {
  drawLevel(score);

  for (var id in players) {
    var player = players[id];
    console.log(player.id);
    if (
      player.id === p1 ||
      player.id === p2 ||
      player.id === p3 ||
      player.id === p4
    ) {
      drawPlayer(player);
      for (var fid in flags) {
        var flag = flags[fid];
        drawFlag(flag);
      }
    }
  }
  for (var sid in AS) {
    var spell = AS[sid];
    if (spell.name === "ridge") {
      drawRidge(spell);
    }
  }
  for (var asid in AAS) {
    var spell = AAS[asid];
    if (spell.name === "analogRidge") {
      drawAnalogRidge(spell);
    }
  }
  if (win !== -1 && team === win) {
    drawWin();
  } else if (win !== -1 && team !== win) {
    drawLoss();
  }
  if (timer > 0) {
    drawTimer(timer);
  }
});

function drawLevel(score) {
  context.clearRect(0, 0, 1000, 550);
  context.fillStyle = "gray";
  context.beginPath();
  context.rect(0, 0, 120, 550);
  context.fill();
  context.beginPath();
  context.rect(875, 0, 1000, 550);
  context.fill();
  context.fillStyle = "blue";
  context.font = "30px Arial";
  context.fillText(score[0].toString(), 20, 50);
  context.fillStyle = "blue";
  context.font = "30px Arial";
  context.fillText(score[1].toString(), 980, 50);
  context.fillStyle = "black";
  context.font = "13px Arial";
  /*
  if (gamepads) {
    //var gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      //context.fillText(gamepad.axes[0].toString(), 100, 450);
      //context.fillText(gamepad.axes[1].toString(), 100, 470);
    }

    for (var id in gamepads) {
      if (gamepads[id].axes) {
        context.fillText(gamepads[id].axes[0].toString(), 100, 450);
        context.fillText(gamepads[id].axes[1].toString(), 100, 450);
      }
    }
  }
  */
}

function drawPlayer(player) {
  if (player.team === team) {
    context.fillStyle = "green";
    if (player.flagging) {
      context.fillStyle = "orange";
    }
  } else {
    context.fillStyle = "darkred";
    if (player.flagging) {
      context.fillStyle = "orangered";
    }
  }
  context.beginPath();
  context.arc(player.x, player.y, 20, 0, 2 * Math.PI);
  context.fill();
}

function drawFlag(flag) {
  if (!flag.grabbed) {
    if (flag.team === team) {
      context.fillStyle = "orangered";
    } else {
      context.fillStyle = "orange";
    }
    context.beginPath();
    context.arc(flag.x, flag.y, 8, 0, 2 * Math.PI);
    context.fill();
  }
}

function drawAnalogRidge(spell) {
  context.fillStyle = "black";
  context.translate(spell.rotateX, spell.rotateY);
  context.rotate((spell.angle * Math.PI) / 180);
  context.beginPath();
  context.rect(25, -10, spell.length, spell.width);
  context.rotate(-(spell.angle * Math.PI) / 180);
  context.translate(-spell.rotateX, -spell.rotateY);
  context.fill();
}

function drawRidge(spell) {
  context.fillStyle = "black";
  context.beginPath();
  context.rect(
    spell.leftX,
    spell.topY,
    spell.rightX - spell.leftX,
    spell.bottomY - spell.topY
  );
  context.fill();
}

function drawWin() {
  context.fillStyle = "green";
  context.font = "30px Arial";
  context.fillText("Good job, you won!", 300, 130);
}
function drawLoss() {
  context.fillStyle = "red";
  context.font = "30px Arial";
  context.fillText("Fuck you, pussy. You lost.", 300, 130);
}

function drawTimer(timer) {
  context.fillStyle = "black";
  context.font = "60px Arial";
  context.fillText(timer.toString(), 470, 220);
}
