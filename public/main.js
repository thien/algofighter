$(function(){
  //init sockets
  var socket = io();
  socket.emit('connection');
});
