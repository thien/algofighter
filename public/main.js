var socket = io();
socket.emit('connection');
$('form').submit(function(){
  socket.emit('code submission', $('#code-area').val());
  return false;
});
function clearScreen(context) {
    context.clearRect (0,0,1000,500);
}
function drawBot(x,y,context) {
      context.fillRect(x,y,10,10);
      context.stroke(); 
}
function drawProjectile(x,y,context) {
      context.fillRect(x,y,2,2);
      context.stroke(); 
}

context = document.getElementById('arena').getContext("2d");

function updateGameState(data) {
  clearScreen(context);
  for (var i = 0; i < data["bot"].length; i++) {
    var bot = data["bot"][i];
    drawBot(bot["x"],bot["y"],context);
  }
  for (var i = 0; i < data["projectile"].length; i++) {
    var projectile = data["projectile"][i];
    drawProjectile(projectile["x"],projectile["y"],context);
  }
}

//setInterval(updateGameState,1000);