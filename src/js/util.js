/**
 * @preserve Copyright (c) 2013 David Benjamin and Alan Huang
 * Use of this source code is governed by an MIT-style license that
 * can be found at
 * https://github.com/davidben/webathena
 */
// Only place in first file of each bundle.
"use strict";

function log(arg) {
    if (typeof console != "undefined" && console.log)
        console.log(arg);
}

module.exports.log = log;
