"use strict";

import KDC from './kdc.js';
import arrayutils from './arrayutils.js';

sjcl.random.startCollectors();
// Get some randomness from the server; ideally every browser would
// have a decent source of real randomness, but we don't. We use SJCL,
// so we'll use what entropy we can get (including
// crypto.getRandomValues), so if legitimate randomness is available,
// it will be used. But if not, instead of being obnoxious and popping
// up an angry warning, trust the proxy a bit more and seed the
// entropy pool. It's not /completely/ terrible since most of these
// are nonces and not encryption keys. (When we do generate a key, we
// incorporate the KDC-generated session key since the KDC is already
// a trusted third party in Kerberos. Also GSS-API mutual auth allows
// the server to pick the final key.)
KDC.xhrRequest(null, 'urandom').then(function(data) {
    var bytes = arrayutils.fromBase64(data);
    var words = new Uint32Array(bytes.buffer,
                                bytes.byteOffset,
                                bytes.byteLength / 4);
    // The polyfill + closure compiler conflicts with SJCL's ability
    // to detect Uint32Array, so use a normal array.
    var arr = [];
    for (var i = 0; i < words.length; i++) {
        arr.push(words[i]);
    }
    sjcl.random.addEntropy(arr, arr.length * 32, 'server');
});
