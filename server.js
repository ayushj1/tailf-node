var http = require('http')
var io = require('socket.io')(http);
var fs = require('fs')
var tailf = require('./tailf');

var log_file = process.argv[2];
var port = 8080;
const NEW_LINE_CHARACTERS = ["\n", "\r"];

console.log('Server Running...');

// creation of server and processing client request
var server = http.createServer(function(request, response) {
  var filePath = '.' + request.url;
  if (filePath == './log')
    filePath = './html/index.html';

  fs.readFile(filePath, function(error, content) {
    if (error) {
      response.writeHead(404);
      response.end('Incorrect location');
    } else {
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      response.end(content, 'utf-8');
    }
  });

});


// server listening on mentioned port
server.listen(port);
io.listen(server);

// processing initial log data
io.on('connection', function(socket) {
  fs.stat(log_file, function(err, stats) {
    var file_length = stats.size;
    fs.open(log_file, 'r', function(err, fd) {
      if (err) throw err;

      var lastNlines = "";
      var chars = 0;
      var lineCount = 0;

      getPreviousChar(stats, fd, chars, appendLastReadChar);

      function appendLastReadChar(err, lastReadChar) {
        if (err) throw err;
        // append the character before the last character tht was fetched
        // Increment line count after every line break and 
        if (NEW_LINE_CHARACTERS.includes(lastReadChar)) {
          // because \n has already increased line count, no need to add another line for \r
          if (lastReadChar != "\r") {
            if (lastNlines.length > 1) {
              // console.log("Lines Count increased "+lineCount);
              lineCount++;
            }
            // append html <br> instead of os EOF
            lastNlines = "<br>" + lastNlines;
          }
        } else {
          // console.log("Added "+lastReadChar);
          lastNlines = lastReadChar + lastNlines;
        }
        // number of chars read++
        chars++;

        // If we have read all the chars from the file or if 10 lines have been reached then stop and
        // start normal tailf
        if (chars  >= file_length || lineCount >= 10) {
          // print lastNlines 
          socket.emit('init-data', {
            'content': lastNlines
          });

          fs.close(fd, function(error) {
            // close the file
          })

          // add a socket to tail the file
          startTail(file_length, socket);
        } else {
          // recursively append other previous characters until we read N - 10th line or start of file
          getPreviousChar(stats, fd, chars, appendLastReadChar);
        }
      }
    });
  });
});

function getPreviousChar(stat, file, currentCharacterCount, callback) {
  fs.read(file, new Buffer(1), 0, 1, stat.size - 1 - currentCharacterCount, function(err, bytesRead, buffer) {
    if (err) throw err;
    callback(null, buffer.toString());
  });
}

// Incharge of tailf 
function startTail(last_read_position, socket) {
  tailf(log_file, last_read_position, function(err, data) {
    data = data.toString().replace(/\r\n?|\n/g, "<br>");
    socket.emit('mod-data', {
      'content': data
    });
  });
}
