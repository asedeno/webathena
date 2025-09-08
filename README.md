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

### Examples

See the samples folder for some simple samples.

See [Moiraverse](https://github.com/sipb/moiraverse/blob/main/src/lib/webathena.ts) or [mailto](https://github.com/btidor/mailto/blob/master/js/app.js#L242) for an example that requests a Moira ticket.

See [join-dormspam](https://github.com/mit-dormcon/join-dormspam/blob/main/src/lib/webathena.ts) for an example that requests two different types of tickets (which uses a slightly different API).

See <https://github.com/search?q=%23%21request_ticket_v1&type=code> for all search results that call WebAthena (this includes a lot of forks of Zulip, though).
