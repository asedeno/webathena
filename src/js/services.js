"use strict";

import krb from './krb.js';

// Friendly names of known service principals.
// TODO(davidben): Cross-realm?
// TODO(davidben): Move this to a config.js.
var SERVICES = { };
SERVICES["krbtgt/" + krb.realm + "@" + krb.realm] = {
    dangerous: true,
    desc: "Full access to your Athena account"
};
SERVICES["moira/moira7.mit.edu" + "@" + krb.realm] = {
    dangerous: true,
    desc: "View and modify your mailing lists and groups"
};
SERVICES["afs/athena.mit.edu" + "@" + krb.realm] = {
    dangerous: true,
    desc: "Full access to all your files on Athena"
};
SERVICES["zephyr/zephyr" + "@" + krb.realm] = {
    desc: "Send and receive zephyr notices as you"
};

export default SERVICES;
