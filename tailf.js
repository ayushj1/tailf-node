var fs = require('fs');
var filewatcher = require('filewatcher');
var watcher = filewatcher();
var isWatcherAdded = false;

module.exports = function(filePath, readPosition, callback) {

  if (!isWatcherAdded) {
    watcher.add(filePath);
    isWatcherAdded = true;
  }

  watcher.on('change', function(file, stats) {
    if (!stats) console.log('deleted');
    // Empty file
    if (stats.size <= 0) {
      return callback("Empty File");
    }

    fs.open(filePath, 'r', function(err, fd) {
      if (err) throw err;

      var numberOfBytesToRead = stats.size - readPosition;
      if (numberOfBytesToRead == 0) {
        return;
      }
      fs.read(fd, new Buffer(numberOfBytesToRead), 0, numberOfBytesToRead, readPosition,
        function(err, bytesRead, buffer) {
          if (err) throw err;

          if (bytesRead <= 0) {
            return;
          }
          readPosition += bytesRead;
          fs.close(fd, function(err) {
            // close
          });
          callback(null, buffer);
        });
    });
  });
}
