# Project Webathena

<https://webathena.mit.edu>
<https://davidben.net/thesis.pdf>

Webathena is an experiment to bring Project Athena and particularly
Kerberos to the web. It is a JavaScript Kerberos client, paired with a
simple server-side KDC proxy which wraps the Kerberos protocol in
HTTP. The tickets are stored locally in HTML localStorage. It provides
a cross-origin protocol using postMessage to forward service tickets
to web applications needing access to the user's credentials.

Webathena is written by David Benjamin and Alan Huang of the MIT
Student Information Processing Board, with contributions from Alejandro
Sedeño.

## How to run locally?

### Setting up

Make sure you have Python 3 and NodeJS installed.

You can create a Python virtual environment for the KDC:

```sh
$ python3 -m venv .venv
```

and activate it

```sh
$ . .venv/bin/activate
```

Next, install the requirements 

```sh
$ pip install werkzeug pyasn1 dnspython flup
```

### Running

On one terminal tab, run the KDC:

```sh
$ . .venv/bin/activate
(.venv) $ python kdc/kdc.py
```

On another terminal tab, run the WebAthena server:

```sh
$ npm run server
```

Finally, your local WebAthena will be accessible on `http://localhost:8000`

## How to use?

On your frontend, make the login button call a function that uses the `winchan` library (available on NPM). Note that since `winchan` does not support TypeScript, if you use TypeScript, you should create an empty `winchan.d.ts` file on the root of your `src` folder. See the moiraverse and join-dormspam examples below on how to get the ticket(s) as a promise.

On your backend, you need to copy and paste some Python code that will convert the WebAthena JSON tickets into the format that Kerberos actually uses, such as the one in the sample in `docs/samples/shellinabox/ssh-krb-wrapper`. Note that the samples are in Python 2. This code has been ported to Python 3 by [Zulip](https://github.com/zulip/zulip/blob/main/zerver/lib/ccache.py) and [moira-rest-api](https://github.com/sipb/moira-rest-api/blob/main/make_ccache.py).

Once you convert the JSON to a binary format using this code, you can put it into a temporary file and set `KRB5CCNAME` to the path of that file ([example](https://github.com/sipb/moira-rest-api/blob/main/decorators.py#L87)), so any processes you spawn will use the user's kerberos tickets ([moira Python example](https://github.com/sipb/moira-rest-api/blob/main/moira_query.py)).

## Frontend parameters

You can pass the following parameters to WebAthena from the frontend via `WinChan.open()`.

* `url`: must be `https://webathena.mit.edu/#!request_ticket_v1` (or your local instance during development)
* `relay_url`: must be `https://webathena.mit.edu/relay.html` (or your local instance during development)
* `params`:
    - `services`: a list of services (objects with a `realm` and a `principal`, see below)
    - Alternatively, you can pass a single service by passing `realm` and `principal` directly.
    - `explanation`: optionally pass a string to show during the permission(s) prompt, to explain to users why you need the permission(s) you are requesting
    - `user`: Not usually needed or useful. An object with a `principal` (an array, possibly containing only one string, the username) and a `realm`, which will make WebAthena return `{ status: "DENIED", code: "WRONG_USER" }` if the ticket you get corresponds to a different user than the requested one.

Service parameters
* `realm`: for MIT, it is `ATHENA.MIT.EDU`
* `principal`: the specific service to request tickets for, such as `['moira', 'moira7.mit.edu']`

To figure out what you need for the service, you can use the service (e.g. by running a shell command), and then run `klist`:

```sh
Ticket cache: KCM:1000
Default principal: rgabriel@ATHENA.MIT.EDU

Valid starting       Expires              Service principal
11/29/2024 09:15:07  11/30/2024 06:30:05  moira/moira7.mit.edu@ATHENA.MIT.EDU
	renew until 11/30/2024 09:15:02
11/29/2024 09:15:05  11/30/2024 06:30:05  krbtgt/ATHENA.MIT.EDU@ATHENA.MIT.EDU
	renew until 11/30/2024 09:15:02
11/29/2024 22:43:19  11/30/2024 06:30:05  zephyr/zephyr@ATHENA.MIT.EDU
	renew until 11/30/2024 09:15:02
```

For example, `hello/world@ATHENA.MIT.EDU` becomes

```js
{
    realm: "ATHENA.MIT.EDU",
    principal: ["hello", "world"]
}
```

### Examples

See the samples folder for some simple samples.

See [Moiraverse](https://github.com/sipb/moiraverse/blob/main/src/lib/webathena.ts) or [mailto](https://github.com/btidor/mailto/blob/master/js/app.js#L242) for an example that requests a Moira ticket.

See [join-dormspam](https://github.com/mit-dormcon/join-dormspam/blob/main/src/lib/webathena.ts) for an example that requests two different types of tickets (which uses a slightly different API).

See <https://github.com/search?q=%23%21request_ticket_v1&type=code> for all search results that call WebAthena (this includes a lot of forks of Zulip, though).
