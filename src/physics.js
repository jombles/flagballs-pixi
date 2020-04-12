const { Circle } = require("detect-collisions");

const system = require("./index");

var dots = [
  [0, -20],
  [14.142, -14.142],
  [20, 0],
  [14.142, 14.142],
  [0, 20],
  [-14.142, 14.142],
  [-20, 0],
  [-14.142, -14.142]
];

class Puck {
  constructor(startingX, startingY) {
    this.levelSizeX = 1000;
    this.levelSizeY = 550;
    this.spawnX = startingX;
    this.spawnY = startingY;
    this.x = startingX;
    this.y = startingY;
    this.xd = 0;
    this.yd = 0;
    this.xa = 0.0;
    this.ya = 0.0;
    this.sx = 0.0;
    this.sy = 0.0;
    this.d = 0.0;
    this.m = 2;
    this.hX = startingX + 10;
    this.hY = startingY;
    this.prevX = startingX + 9;
    this.prevY = startingY - 1;
    this.aon = false;
    this.won = false;
    this.don = false;
    this.son = false;
    this.braking = false;
    this.speedMultiplier = 300.0;
    this.size = 10;
    this.locXSpeedMultiplier = 300.0;
    this.frictionXMultiplier = 300.0;
    this.locYSpeedMultiplier = 300.0;
    this.frictionYMultiplier = 300.0;
    this.boosted = false;
    this.boosting = false;
    this.fullBoostLoops = 0;
    this.maxSpeedMod = 6;
    this.globalSpeedMod = 0.6;
    this.controllerEnabled = false;
    this.controllerX = 0.0;
    this.controllerY = 0.0;
    this.controllerDist = 0.0;
    this.justBounced = false;
  }

  updatePositionC(timeDifference) {
    if (
      this.controllerX < 0.08 &&
      this.controllerX > -0.08 &&
      this.controllerY < 0.08 &&
      this.controllerY > -0.08
    ) {
      //console.log("no movment");
      this.calculateForce(-2, timeDifference);
    } else {
      //console.log("still moving for some reason");
      var radAngle = Math.atan2(-this.controllerX, -this.controllerY);
      var angle = radAngle * (180 / Math.PI) + 180;
      var hLength = Math.sqrt(
        this.controllerX * this.controllerX +
          this.controllerY * this.controllerY
      );

      this.controllerDist = hLength;
      this.calculateForce(angle, timeDifference);
    }
    if (this.x > this.levelSizeX - this.size) {
      this.x = this.levelSizeX - this.size;
      this.xa = -this.xa;
      this.sx = -this.sx;
    }
    if (this.x < 5) {
      this.x = 5;
      this.xa = -this.xa;
      this.sx = -this.sx;
    }
    if (this.y > this.levelSizeY - this.size) {
      this.y = this.levelSizeY - this.size;
      this.ya = -this.ya;
      this.sy = -this.sy;
    }
    if (this.y < 5) {
      this.y = 5;
      this.ya = -this.ya;
      this.sy = -this.sy;
    }
  }

  calculateForce(d, timeDifference) {
    if (
      (d === -1 || d === -2) &&
      this.sx < 1.3 &&
      this.sx > -1.3 &&
      this.sy < 1.3 &&
      this.sy > -1.3
    ) {
      this.sx = 0;
      this.sy = 0;
      return;
    }
    var speedMod = 1.4;
    var accelMod = 0.92;
    var radians = (d * Math.PI) / 180.0;
    var friction = 0;
    friction = Math.atan2(-this.xa, -this.ya);
    if (d === -1 || d === -2) {
      radians = friction;
    }
    var xFriction = (8 * Math.sin(friction)) / timeDifference;
    var xChange = (8 * Math.sin(radians)) / timeDifference;
    var yFriction = (8 * Math.cos(friction)) / timeDifference;
    var yChange = (8 * Math.cos(radians)) / timeDifference;

    if (xChange < 0.01 && xChange > -0.01) {
      xChange = xFriction;
    }
    if (yChange < 0.01 && yChange > -0.01) {
      yChange = yFriction;
    }

    this.sy += (yChange * accelMod) / 2.5;
    this.sx += (xChange * accelMod) / 2.5;
    if (this.sx > this.maxSpeedMod) {
      this.sx = this.maxSpeedMod;
    }
    if (this.sx < -this.maxSpeedMod) {
      this.sx = -this.maxSpeedMod;
    }
    if (this.sy > this.maxSpeedMod) {
      this.sy = this.maxSpeedMod;
    }
    if (this.sy < -this.maxSpeedMod) {
      this.sy = -this.maxSpeedMod;
    }
    /*if (d <= 90) {
      this.sy += xChange / 10;
      this.sa += yChange / 10;
    } else if (d <= 180) {
      this.sx -= xChange / 10;
      this.sy += yChange / 10;
    } else if (d <= 270) {
      this.sx -= xChange / 10;
      this.sy -= yChange / 10;
    } else {
      this.sx += xChange / 10;
      this.sy += yChange / 10;
    }*/
    var brakeSMod = 2.15;
    var brakeAMod = 1.05;
    var boostSMod = 1.0;
    var boostAMod = 1.0;

    if (this.boosted && !this.boosting) {
      this.boosting = true;
      this.boosted = false;
      this.maxSpeedMod = 14;
      this.fullBoostLoops = 4;
      var that = this;
      setTimeout(function() {
        that.boosting = false;
        that.maxSpeedMod = 11;
        setTimeout(function() {
          that.boosting = false;
          that.maxSpeedMod = 6;
        }, 400);
      }, 900);
    }
    if (this.boosting) {
      boostSMod = 0.8;
      boostAMod = 1.95;
      if (this.fullBoostLoops !== 0) {
        boostSMod = 2.5;
        boostAMod = 2.7;
        this.fullBoostLoops -= 1;
      }
    }

    if (this.braking === false) {
      this.xa = xChange * speedMod * boostSMod + this.sx * boostAMod;
      this.ya = yChange * speedMod * boostSMod + this.sy * boostAMod;
    }
    if (this.braking === true) {
      //if ((xChange > 0 && this.xa > 0) || (xChange < 0 && this.xa < 0)) {
      this.sx = this.sx / brakeAMod;
      //}
      //if ((yChange > 0 && this.ya > 0) || (yChange < 0 && this.ya < 0)) {
      this.sy = this.sy / brakeAMod;
      //}
      this.xa = xChange * brakeSMod + this.sx;
      this.ya = yChange * brakeSMod + this.sy;
    }
    if (d === -1) {
      if (this.xa < 0.9 && this.xa > -0.9) {
        this.xa = 0;
        this.sx = this.sx / 1.2;
      }
      if (this.ya < 0.9 && this.ya > -0.9) {
        this.ya = 0;
        this.sy = this.sy / 1.2;
      }
    }
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.xa > 0.35 || this.xa < -0.35) {
      if (this.controllerEnabled) {
        this.xd = this.xa * this.globalSpeedMod * this.controllerDist;
        this.x += this.xd;
      } else {
        this.xd = this.xa * this.globalSpeedMod;
        this.x += this.xd;
      }
    }
    if (this.ya > 0.35 || this.ya < -0.35) {
      if (this.controllerEnabled) {
        this.yd = this.ya * this.globalSpeedMod * this.controllerDist;
        this.y += this.yd;
      } else {
        this.yd = this.ya * this.globalSpeedMod;
        this.y += this.yd;
      }
    }
  }

  checkAnalogRidgeCollisions2(activeSpells) {
    for (var id in activeSpells) {
      var spell = activeSpells[id];
      var x1 = spell.x1;
      var x2 = spell.x2;
      var x3 = spell.x3;
      var x4 = spell.x4;
      var y1 = spell.y1;
      var y2 = spell.y2;
      var y3 = spell.y3;
      var y4 = spell.y4;
      if (spell.angle < 270 && spell.angle >= 180) {
        x1 = spell.x3;
        x2 = spell.x1;
        x3 = spell.x4;
        x4 = spell.x2;
        y1 = spell.y3;
        y2 = spell.y1;
        y3 = spell.y4;
        y4 = spell.y2;
      } else if (spell.angle < 180 && spell.angle >= 90) {
        x1 = spell.x4;
        x2 = spell.x3;
        x3 = spell.x2;
        x4 = spell.x1;
        y1 = spell.y4;
        y2 = spell.y3;
        y3 = spell.y2;
        y4 = spell.y1;
      } else if (spell.angle < 90 && spell.angle >= 0) {
        x1 = spell.x2;
        x2 = spell.x4;
        x3 = spell.x1;
        x4 = spell.x3;
        y1 = spell.y2;
        y2 = spell.y4;
        y3 = spell.y1;
        y4 = spell.y3;
      }
      var lineCoords = [[x1, y1], [x3, y3], [x4, y4], [x2, y2]];
      /*if (
        this.x + 22 > x1 &&
        this.x - 22 < x4 &&
        (this.y - 22 < y2 && this.y + 22 > y3)
      ) {*/
      for (var i = 0; i < dots.length; i++) {
        var dx = dots[i][0];
        var dy = dots[i][1];
        for (var j = 0; j < lineCoords.length; j++) {
          var p = lineCoords[j][0];
          var q = lineCoords[j][1];
          var r = lineCoords[(j + 1) % 4][0];
          var s = lineCoords[(j + 1) % 4][1];
          var a = this.prevX + dx;
          var b = this.prevY + dy;
          var c = this.x + dx;
          var d = this.y + dy;
          //console.log("a: " + a);
          //console.log("b: " + b);
          //console.log("c: " + c);
          //console.log("d: " + d);
          //console.log("p: " + p);
          //console.log("q: " + q);
          //console.log("r: " + r);
          //console.log("s: " + s);
          var det, gamma, lambda;
          det = (c - a) * (s - q) - (r - p) * (d - b);
          if (det === 0) {
            console.log("parrallel");
          } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            if (
              -0.01 < lambda &&
              lambda < 1.01 &&
              (0.01 < gamma && gamma < 1.01)
            ) {
              console.log("det: " + det);
              var dey = q - s;
              var dex = p - r;
              var theta = Math.atan2(dey, dex);
              var puckTheta = Math.atan2(this.sy, this.sx);
              var puckH = Math.sqrt(this.sy * this.sy + this.sx * this.sx);
              var finalAngle = theta + theta - puckTheta;
              finalAngle += 2 * 1.57;
              this.sx = -puckH * Math.cos(finalAngle);
              this.sy = -puckH * Math.sin(finalAngle);
              //this.y += this.sy * 2;
              //this.x += this.sx * 2;
              //this.sy = -puckH * Math.sin(finalAngle);
              //this.sx = -puckH * Math.cos(finalAngle);
              var moveY = 12 * Math.sin(theta - 1.5707);
              var moveX = -12 * Math.cos(theta - 1.5707);
              var cx = a + lambda * (c - a);
              var cy = b + lambda * (d - b);
              console.log("cx: " + cx);
              console.log("cy: " + cy);
              console.log("this x: " + this.x);
              moveX = cx - c;
              moveY = cy - d;
              if (j === 3 || j === 0) {
                moveX = -(Math.abs(moveX) + 0.2);
              } else {
                moveX = Math.abs(moveX) + 0.2;
              }
              if (j === 0 || j === 1) {
                moveY = -(Math.abs(moveY) + 0.2);
              } else {
                moveY = Math.abs(moveY) + 0.2;
              }
              this.y += moveY;
              this.x += moveX;
              //console.log("theta: " + (theta * 180) / Math.PI);
              //console.log("otheta: " + ((theta - 1.5708) * 180) / Math.PI);

              console.log("dTheta: " + finalAngle - theta);
              return;
            }
          }
        }
      }
      /*}*/
    }
  }
}

module.exports = {
  Puck: Puck
};
