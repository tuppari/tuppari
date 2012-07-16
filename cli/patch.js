// To prevent warning message running on Node >= 0.8.0
var tty = require('tty');
if (process.stdin.setRawMode) {
  tty.setRawMode = function (flag) {
    return process.stdin.setRawMode.call(process.stdin, flag);
  };
}

// Monkey patch for commandar issue #72 (https://github.com/visionmedia/commander.js/issues/72)
var keypress = require('keypress');
// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);