$(document).ready(function() {
  var socket = io.connect();
  var cont = $('#container');
  var html = $('html, body');
  var appendFunction = function(data) {
    var data_val = $('<span>' + data.content + '</span>');
    cont.append(data_val);
  }
  // appending initial data to container
  socket.on('init-data', appendFunction);
  // appending modified data to container
  socket.on('mod-data', appendFunction);
});