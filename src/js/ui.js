"use strict";

import kcrypto from './kcrypto.js';
import krb from './krb.js';
import KDC from './kdc.js';
import SERVICES from './services.js';
import arrayutils from './arrayutils.js';
import WinChan from 'winchan';
import { log } from './util.js';

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
}).done();

function UserError(message) {
    this.message = message;
}
UserError.prototype.toString = function() {
    return this.message;
};

function handleLoginPrompt(login) {
    var deferred = Q.defer();

    // If there's a logout link, hook it up.
    login.find('.logout-link').click(function(e) {
        e.preventDefault();
        login.remove(); // TODO: Fade out?
        deferred.resolve(showLoginPrompt());
    });

    login.find('form').submit(function(e) {
        e.preventDefault();
        var $this = $(this);

        $('#alert').slideUp(100);
        var usernameInput = $this.find('.username'),
            passwordInput = $this.find('.password'),
            username = usernameInput.val(),
            password = passwordInput.val(),
            fail = false;
        if (!username) {
            $this.find('.username + .error').fadeIn();
            fail = true;
        } else {
            $this.find('.username + .error').fadeOut();
        }
        if (!password) {
            $this.find('.password + .error').fadeIn();
            fail = true;
        } else {
            $this.find('.password + .error').fadeOut();
        }
        if (fail)
            return;

        passwordInput.val('');
        var submit = $this.find('.submit');
        var text = submit.text();
        submit.attr('disabled', 'disabled').text('.');
        var interval = setInterval(function() {
            submit.text((submit.text() + '.').replace('.....', '.'));
        }, 500);
        var resetForm = function() {
            clearInterval(interval);
            submit.attr('disabled', null).text(text);
        };
        return Q.fcall(krb.Principal.fromString, username).then(function(principal) {
            // Not actually a user error, but...
            if (principal.realm != krb.realm)
                throw new UserError("Cross-realm not supported!");
            return KDC.getTGTSession(principal, password);
        }).then(function(tgtSession) {
            resetForm();
            // Position-absolute it so it doesn't interfere with its
            // replacement. jQuery's position function tries to take
            // the margins into account and this seems to be
            // buggy. Just compute the position straight and be done
            // with it.
            var position = login.get(0).getBoundingClientRect();
            var parentPosition =
                login.offsetParent().get(0).getBoundingClientRect();
            login.css({
                margin: '0',
                position: 'absolute',
                top: (position.top - parentPosition.top) + 'px',
                left: (position.left - parentPosition.left) + 'px'
            });
            login.fadeOut(function() { $(this).remove(); });
            deferred.resolve(tgtSession);
        }, function(error) {
            var string, nodes, rethrow = false;
            if (error instanceof kcrypto.DecryptionError) {
                string = 'Incorrect password!';
            } else if (error instanceof krb.PrincipalError) {
                string = 'Bad username!';
            } else if (error instanceof KDC.Error) {
                if (error.code == krb.KDC_ERR_C_PRINCIPAL_UNKNOWN) {
                    string = 'User does not exist!';
                } else if (error.code == krb.KDC_ERR_PREAUTH_FAILED ||
                           error.code == krb.KRB_AP_ERR_BAD_INTEGRITY) {
                    string = 'Incorrect password!';
                } else if (error.code == krb.KDC_ERR_ETYPE_NOSUPP) {
                    nodes = $('#bad-etype-template').children().clone();
                } else {
                    string = error.message;
                }
            } else if (error instanceof kcrypto.NotSupportedError) {
                nodes = $('#bad-etype-template').children().clone();
            } else if (error instanceof KDC.NetworkError ||
                       error instanceof KDC.ProtocolError ||
                       error instanceof UserError) {
                string = error.toString();
            } else {
                // Anything else is an internal error. Rethrow it.
                string = 'Internal error: ' + error;
                rethrow = true;
            }
            $('#alert-title').text('Error logging in:');
            if (nodes) {
                $('#alert-text').empty();
                $('#alert-text').append(nodes);
            } else {
                $('#alert-text').text(string);
            }
            $('#alert').slideDown(100);
            resetForm();
            if (rethrow)
                throw error;
        }).done();
    });
    return deferred.promise;
}

function showLoginPrompt() {
    var deferred = Q.defer();
    var login = $('#login-template').children().clone();
    login.appendTo(document.body);
    login.find('.username').focus();

    return handleLoginPrompt(login);
}

function showRenewPrompt(oldSession) {
    var deferred = Q.defer();
    var login = $('#renew-template').children().clone();
    var principalStr = oldSession.client.toString();
    login.find('.client-principal').text(principalStr);
    login.find('.username').val(principalStr);
    login.appendTo(document.body);
    login.find('.password').focus();

    return handleLoginPrompt(login);
}


function getTGTSession() {
    // Blow away ccache on format changes.
    var currentVersion = '1';
    if (localStorage.getItem('version') !== currentVersion) {
        localStorage.clear();
        localStorage.setItem('version', currentVersion);
    }

    // Check if we're already logged in.
    var sessionJson = localStorage.getItem('tgtSession');
    if (sessionJson) {
        var tgtSession = krb.Session.fromDict(JSON.parse(sessionJson));
        // Treat as expired if we have less than an hour left. It'd be
        // poor to give clients an old ticket.
        if (tgtSession.timeRemaining() < 60 * 60 * 1000) {
            return showRenewPrompt(tgtSession).then(function(tgtSession) {
                // Save in local storage.
                localStorage.setItem('tgtSession',
                                     JSON.stringify(tgtSession.toDict()));
                return [tgtSession, true];
            });
        }
        return Q.resolve([tgtSession, false]);
    }

    return showLoginPrompt().then(function(tgtSession) {
        // Save in local storage.
        localStorage.setItem('tgtSession',
                             JSON.stringify(tgtSession.toDict()));
        return [tgtSession, true];
    });
}

function makeServiceNode(service) {
    var serviceStr = service.toString();

    var li = document.createElement("li");
    var abbr = document.createElement("abbr");
    li.appendChild(abbr);
    abbr.title = serviceStr;
    if (serviceStr in SERVICES) {
        var info = SERVICES[serviceStr];
        if (info.dangerous)
            li.className = "dangerous";
        $(abbr).text(info.desc);
    } else {
        // Label it "Access BLAH on your behalf".
        // (Okay, fine, dealing with the DOM directly can be annoying.)
        var target = document.createElement("code");
        var detail = null;
        target.className = "identifier";
        if (service.principalName.nameString.length === 2 &&
            service.principalName.nameString[0] === "host") {
            $(target).text(service.principalName.nameString[1]);
        } else if (service.principalName.nameString.length === 2 &&
                   service.principalName.nameString[0] === "HTTP") {
            detail = document.createTextNode("web services on ");
            $(target).text(service.principalName.nameString[1]);
        } else {
            $(target).text(serviceStr);
        }
        abbr.appendChild(document.createTextNode("Access "));
        if (detail)
            abbr.appendChild(detail);
        abbr.appendChild(target);
        abbr.appendChild(document.createTextNode(" on your behalf"));
    }
    return li;
}

function registerTicketAPI() {
    WinChan.onOpen(function (origin, args, cb) {
        // NOTE: origin is a trusted value we get from the browser. args
        // is untrusted data from some other origin. It is absolutely
        // critical that we do not eval anything in there, including as
        // HTML. If attaching it to DOM, only use textContent and
        // equivalent APIs.

        // FIXME: ui.js should probably provide some sane API. Maybe a
        // logged in callback? I dunno. Really the UI flow should probably
        // be controlled by the page with ui.js or something similar just
        // providing the functions to actually create these things? I
        // dunno. This currently has silliness where, if onOpen gets
        // called after the UI is shown, placeholder values are visible.

        // Makes a principal, but is picky about types.
        function makePrincipal(principal, realm) {
            if (typeof realm !== "string")
                throw new TypeError();
            if (!(principal instanceof Array))
                throw new TypeError();
            principal.forEach(function(component) {
                if (typeof component !== "string")
                    throw new TypeError();
            });
            return new krb.Principal({
                nameType: krb.KRB_NT_UNKNOWN,
                nameString: principal
            }, realm);
        }

        var services = [];
        var returnList = true;
        try {
            if (args.services) {
                if (!(args.services instanceof Array))
                    throw TypeError();
                services = args.services.map(function(service) {
                    return makePrincipal(service.principal, service.realm);
                });
                if (services.length == 0)
                    throw Error();
            } else {
                services = [makePrincipal(args.principal, args.realm)];
                returnList = false;
            }
        } catch (e) {
            cb({
                status: "ERROR",
                code: "BAD_REQUEST",
                message: "Bad services argument."
            });
            throw e;
        }

        var user = null;
        if (args.user) {
            try {
                user = makePrincipal(args.user.principal, args.user.realm);
            } catch (e) {
                cb({
                    status: "ERROR",
                    code: "BAD_REQUEST",
                    message: "Bad user argument."
                });
                throw e;
            }
        }

        function deny(code, message) {
            code = code || "NOT_ALLOWED";
            message = message || "The user did not approve the permission grant.";
            cb({
                status: "DENIED",
                code: code,
                message: message
            });
        }

        // Require everyone to use SSL. (Is there no better way to do this
        // check.) We'll want to allow things like chrome-extension:// in
        // future probably, though chrome-extension://aslkdfjsdlkfjdslkfs
        // is not a useful string. Also allow things running over
        // localhost. Overwise testing is a nightmare.
        if (!origin.startsWith("https:") &&
            !origin.startsWith("http://localhost:") &&
            !origin.startsWith("http://127.0.0.1:")) {
            deny("BAD_ORIGIN", "Site must be under SSL or hosted on localhost.");
            return;
        }

        getTGTSession().then(function(r) {
            var tgtSession = r[0], prompted = r[1];

            if (user) {
                // If the caller requested a particular user, don't give
                // them back a mismatching principal.
                //
                // TODO(davidben): Be less confusing and use this to inform
                // the UI somehow. Multiple sign-on?
                if (tgtSession.client.realm != user.realm ||
                    !krb.principalNamesEqual(tgtSession.client.principalName,
                                             user.principalName)) {
                    cb({
                        status: "DENIED",
                        code: "WRONG_USER"
                    });
                    return;
                }
            }

            var authed = $('#request-ticket-template').children().clone();
            authed.appendTo(document.body);
            if (prompted)
                authed.fadeIn();

            authed.find('.client-principal').text(tgtSession.client.toString());
            authed.find('.foreign-origin').text(origin);
            var permissionList = authed.find('.permission-list');
            services.forEach(function(service) {
                permissionList.append(makeServiceNode(service));
            });
            authed.find('.service-principal').text(
                services.map(function(service) {
                    return service.toString(); }).join(', '));

            authed.find('.request-ticket-deny').click(function() { deny() });
            authed.find('.request-ticket-allow').click(function(e) {
                // None of these errors should really happen. Ideally this
                // file would be in control of the UI and this event
                // listener would only be hooked up when we've got a valid
                // tgtSession.
                if (!localStorage.getItem("tgtSession")) {
                    log('No ticket');
                    deny();
                    return;
                }

                if (tgtSession.isExpired()) {
                    // I guess this is actually possible if the ticket
                    // expires while this user is deliberating.
                    log('Ticket expired');
                    deny();
                    return;
                }

                // User gave us permission and we have a legit TGT. Let's go!
                Q.all(services.map(function(service) {
                    return KDC.getServiceSession(tgtSession, service);
                })).then(function(sessions) {
                    // TODO: Do we want to store this in the ccache
                    // too, so a service which doesn't cache its own
                    // tickets needn't get new ones all the time?
                    // Also, the ccache needs some fancy abstraction
                    // or something.
                    if (returnList) {
                        cb({
                            status: 'OK',
                            sessions: sessions.map(function(session) {
                                return session.toDict();
                            })
                        });
                    } else {
                        cb({
                            status: 'OK',
                            session: sessions[0].toDict()
                        });
                    }
                }, function (error) {
                    // TODO(davidben): This is an internal error. We
                    // shouldn't close just yet.
                    log(error);
                    deny();
                }).done();
            });
        }).done();
    });
}

$(function() {
    $('#eye1').css({ left: 78, top: 12 }).removeAttr('hidden');
    $('#eye2').css({ left: 87, top: 16 }).removeAttr('hidden');
    $('#eye3').css({ left: 105, top: 16 }).removeAttr('hidden');
    $('#eye4').css({ left: 121, top: 12 }).removeAttr('hidden');
    $(document).mousemove(function(event) {
        $('#logo img').each(function() {
            var dx = event.pageX - $(this).offset().left - $(this).width() / 2,
                dy = event.pageY - $(this).offset().top - $(this).height() / 2,
                transform = 'rotate(' + Math.atan2(dx, -dy) + 'rad)';
            // jQuery handles prefixes for us. Also browsers are
            // unprefixing this anyway.
            $(this).css({ transform: transform });
        });
    });

    $('#whatis a').click(function() {
        $('#info').slideToggle(0)
                  .css('height', $('#info').height())
                  .slideToggle(0)
                  .slideToggle();
        return false;
    });

    function mainPage() {
        getTGTSession().then(function(r) {
            var tgtSession = r[0], prompted = r[1];

            var authed = $('#authed-template').children().clone();
            authed.appendTo(document.body);
            if (prompted)
                authed.fadeIn();
            // TODO: The main page should be more useful. Maybe a
            // listing of random things you can do with your Athena
            // account.
            authed.find('.client-principal').text(tgtSession.client.toString());
            authed.find('button.logout').click(function() {
                localStorage.removeItem('tgtSession');
                // TODO: Fade this out and the login panel
                // in. Probably fades of the currently active panel
                // should be handled be a container.
                authed.remove();
                mainPage();
            });
        }).done();
    }

    if (location.hash == '#!request_ticket_v1') {
        registerTicketAPI();
    } else {
        mainPage();
    }
});
