"use strict";

var HEX_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                  "A", "B", "C", "D", "E", "F"];

function arrayToHex(array) {
  return escape(arrayutils.toByteString(array));
}

function arraysEqual(value, expected, msg) {
  assert.strictEqual(arrayToHex(value), arrayToHex(expected), msg);
}

module.exports.arrayToHex = arrayToHex;
module.exports.arraysEqual = arraysEqual;

