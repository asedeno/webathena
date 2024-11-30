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

