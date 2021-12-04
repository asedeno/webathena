import {html, css, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import WinChan from 'winchan';

import kcrypto from '../js/kcrypto.js';
import krb from '../js/krb.js';
import KDC from '../js/kdc.js';
import SERVICES from '../js/services.js';
import {log} from '../js/util.js';

import {WebathenaAlertDetails} from './alert';
import {bodyStyles, errorStyles, webathenaStyles} from '../constants/css';
import {webathenaWarning} from '../constants/html';

interface WinChanArgs {
  origin: string;
  args: any;
  cb: Function;
  user: any;
  services: any;
  returnList: boolean;
}

@customElement('webathena-ui')
export class WebathenaUI extends LitElement {
  static styles = [
    bodyStyles,
    errorStyles,
    webathenaStyles,
  ];

  @state() protected _usernameError: boolean = false;
  @state() protected _passwordError: boolean = false;
  @state() protected _defaultPrincipal = null;
  @state() protected _ccache = [];
  @state() protected _ccacheIndex = {};
  @state() protected _tktReq: boolean = false;
  @state() protected _tktReqData: WinChanArgs | null = null;

  constructor() {
    super();
    this.loadCCache();
    if (window.location.hash == '#!request_ticket_v1') {
      this._tktReq = true;
      WinChan.onOpen(this._tktReqOnOpen);
    }
  }

  //********************************************************************************
  // Utility methods


  protected static _ccacheVersion: string = '2';

  loadCCache() {
    if (localStorage.getItem('version') !== WebathenaUI._ccacheVersion) {
      localStorage.clear();
      localStorage.setItem('version', WebathenaUI._ccacheVersion);
    }

    let defaultPrincipal = localStorage.getItem('defaultPrincipal');
    if (defaultPrincipal) {
      this._defaultPrincipal = krb.Principal.fromString(defaultPrincipal);
    }

    let ccacheJson = localStorage.getItem('ccache');
    if (ccacheJson) {
      let ccache = JSON.parse(ccacheJson);
      try {
        this._ccache = ccache.map(
          (tktDict, idx) => {
            let session = krb.Session.fromDict(tktDict);
            this._ccacheIndex[session.service.toString()] = idx;
            return session;
          }
        );
      } catch (err) {
        this._logout();
      }
    }
  }

  saveCCache() {
    if (this._ccache || this._defaultPrincipal) {
      localStorage.setItem('version', WebathenaUI._ccacheVersion);
      if (this._defaultPrincipal) {
        localStorage.setItem('defaultPrincipal', this._defaultPrincipal.toString());
      }
      if (this._ccache) {
        localStorage.setItem(
          'ccache',
          JSON.stringify(this._ccache.map(
            (entry) => entry.toDict()
          ))
        )
      }
    }
  }

  private _tktReqOnOpen = (origin, args, cb) => {
    // Makes a principal, but is picky about types.
    const makePrincipal = (principal, realm) => {
      if (typeof realm !== "string") {
        throw new TypeError();
      }
      if (!(principal instanceof Array)) {
        throw new TypeError();
      }
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
        if (!(args.services instanceof Array)) {
          throw TypeError();
        }
        services = args.services.map((svc) => {
          return makePrincipal(svc.principal, svc.realm);
        });
        if (services.length == 0) {
          throw Error();
        }
      } else {
        services = [makePrincipal(args.principal, args.realm)];
        returnList = false;
      }
    } catch (err) {
      cb({
        status: "ERROR",
        code: "BAD_REQUEST",
        message: "Bad services argument."
      });
      throw err;
    }

    var user = null;
    if (args.user) {
      try {
        user = makePrincipal(args.user.principal, args.user.realm);
      } catch (err) {
        cb({
          status: "ERROR",
          code: "BAD_REQUEST",
          message: "Bad services argument."
        });
        throw err;
      }
    }

    const deny = (code, message) => {
      code = code || "NOT_ALLOWED";
      message = message || "The user did not approve the permission grant.";
      cb({
        status: "DENIED",
        code: code,
        message: message
      });
    };

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

    this._tktReqData = {
      origin: origin,
      args: args,
      cb: cb,
      user: user,
      services: services,
      returnList: returnList,
    };

    this.requestUpdate();
  };


  //********************************************************************************
  // Render functions

  errorElement(label) {
    return html`<div class="error">&#x25C0;    Please enter your ${label}</div>`;
  }

  render_login() {
    return html`
      <div class="login body">
        <form>
          <table class="form-box">
            <tr>
              <td><label for="username">Username</label></td>
              <td>
                <div class="container">
                  <input class="username" type="text" autofocus>
                  ${this._usernameError ? this.errorElement('username') : ''}
                </div>
              </td>
            </tr>
            <tr>
              <td><label for="password">Password</label></td>
              <td>
                <div class="container">
                  <input class="password" type="password" autocomplete="off">
                  ${this._passwordError ? this.errorElement('password') : ''}
                </div>
              </td>
            </tr>
            <tr>
              <td colspan=2>
                <button class="submit" @click=${this._doLogin}>Log in to Athena</button>
              </td>
            </tr>
          </table>
          ${webathenaWarning}
        </form>
      </div>`;
  }

  render_renew() {
    return html`
      <div class="login body">
        <form>
          <div class="login-message">Your login has expired.</div>
          <table class="form-box">
            <tr><td colspan=2 class="client-principal identifier">${this._defaultPrincipal.toString()}</td></tr>
            <tr>
              <td><label for="password">Password</label></td>
              <td>
                <div class="container">
                  <input class="username" type="hidden" value="${this._defaultPrincipal.toString()}">
                  <input class="password" type="password" autocomplete="off">
                  ${this._passwordError ? this.errorElement('password') : ''}
                </div>
              </td>
            </tr>
            <tr>
              <td colspan=2>
                <button name="submit" @click=${this._doLogin}>Renew login</button>
              </td>
            </tr>
          </table>
          ${webathenaWarning}
        </form>
        <div class="logout">
          <a href="#" @click=${this._logout}>Login as another user.</a>
        </div>
      </div>
    `;
  }

  render_klist_ccache_node(entry) {
    let startTime = entry.starttime || entry.authtime;
    let endTime = entry.endtime;
    return html`
      <div class="service-ticket">${entry.service.toString()}</div>
    `;
  };

  render_klist() {
    return html`
      <div class="authed body">
        <p>You are logged in as</p>
        <p class="client-principal identifier">${this._defaultPrincipal.toString()}</p>
        <p><button class="logout" @click=${this._logout}>Log out</button></p>
        <p><div>Service Tickets:</div>
          ${this._ccache.map(this.render_klist_ccache_node)}
        </p>
      </div>`;
  }


  render_tktReq_svcnode(svc) {
    var serviceStr = svc.toString();
    if (serviceStr in SERVICES) {
      var info = SERVICES[serviceStr];
      var cls = '';
      if (info.dangerous) {
        cls = 'dangerous';
      }
      return html`
        <li class="${cls}">
          <abbr title="${serviceStr}">${info.desc}</abbr>
        </li>
      `;
    }
    var detail = '';
    var target = serviceStr;
    if (svc.principalName.nameString.length == 2) {
      switch(svc.principalName.nameString[0]) {
        case 'host': {
          target = svc.principalName.nameString[1];
          break;
        }
        case 'HTTP': {
          target = svc.principalName.nameString[1];
          detail = 'web services on ';
          break;
        }
      }
    }
    return html`
      <li>
        <abbr title="${serviceStr}">Access ${detail} <code class="identifier">${target}</code> on your behalf</abbr>
      </li>
    `;
  }

  render_tktReq() {
    var req_body = html`
      <div class="authed body">
        <p>You are logged in as</p>
        <p class="client-principal identifier">${this._defaultPrincipal.toString()}</p>
        <p class="foreign-origin identifier">${this._tktReqData.origin}</p>
        <p>requests permission to</p>
        <ul class="permission-list">
          <li>Learn your email address</li>
          ${this._tktReqData.services.map(this.render_tktReq_svcnode)}
        </ul>
        <div class="button-box">
          <button @click=${this._tktReqAllow}>Allow</button>
          <button @click=${this._tktReqDeny}>Deny</button>
        </div>
      </div>`;
    return req_body;
  }

  render() {
    if (this._ccache && this._ccache[0]) {
      if (this._ccache[0].timeRemaining() < 60 * 60 * 1000) {
        return this.render_renew();
      }
      if (this._tktReq) {
        if (this._tktReqData) {
          if (this._tktReqData.user && (
            this._defaultPrincipal.realm != this._tktReqData.user.realm ||
            !krb.principalNamesEqual(this._defaultPrincipal.principalName,
                                     this._tktReqData.user.principalName))) {
            this._tktReqData.cb({
              status: 'DENIED',
              code: 'WRONG_USER',
            });
            return html``;
          }
          return this.render_tktReq();
        }
        return html``;
      }
      return this.render_klist();
    }
    return this.render_login();
  }


  //********************************************************************************
  // on-click handlers

  private _logout = () => {
    localStorage.removeItem('ccache');
    localStorage.removeItem('defaultPrincipal');
    this._defaultPrincipal = null;
    this._ccache = null;
    this._ccacheIndex = {};
    this.requestUpdate();
  }

  private async _doLogin(event: Event) {
    event.preventDefault();
    this.dispatchEvent(new Event('webathena-dismiss-alert', {bubbles: true, composed: true}));
    this.requestUpdate();
    const button = event.target as HTMLButtonElement;
    const usernameInput = this.shadowRoot.querySelector('input.username') as HTMLInputElement;
    const passwordInput = this.shadowRoot.querySelector('input.password') as HTMLInputElement;

    const username = usernameInput.value;
    const password = passwordInput.value;

    var fail: boolean = false;
    if (!username) {
      fail = true;
      this._usernameError = true;
    } else {
      this._usernameError = false;
    }
    if (!password) {
      fail = true;
      this._passwordError = true;
    } else {
      this._passwordError = false;
    }

    if (fail) {
      return;
    }

    passwordInput.value = '';
    button.disabled = true;

    // TODO: spinner
    const principal = krb.Principal.fromString(username);
    if (principal.realm != krb.realm) {
      window.dispatchEvent(new CustomEvent('webathena-alert', {detail: {title: 'Error logging in:',
                                                                        text: 'Cross-realm not supported!'}}));
      button.disabled = false;
      return;
    }

    try {
      let tgtSession = await KDC.getTGTSession(principal, password);
      this._ccache = [tgtSession];
      this._ccacheIndex = {};
      this._ccacheIndex[tgtSession.service.toString()] = 0;
      this._defaultPrincipal = tgtSession.client;
    } catch (error) {
      var detail: WebathenaAlertDetails = {
        title: 'Error logging in:',
        text: null,
        badEncType: false,
      }

      var rethrow = false;
      if (error instanceof kcrypto.DecryptionError) {
        detail.text = 'Incorrect password!';
      } else if (error instanceof krb.PrincipalError) {
        detail.text = 'Bad username!';
      } else if (error instanceof KDC.Error) {
        if (error.code == krb.KDC_ERR_C_PRINCIPAL_UNKNOWN) {
          detail.text = 'User does not exist!';
        } else if (error.code == krb.KDC_ERR_PREAUTH_FAILED ||
                   error.code == krb.KRB_AP_ERR_BAD_INTEGRITY) {
          detail.text = 'Incorrect password!';
        } else if (error.code == krb.KDC_ERR_ETYPE_NOSUPP) {
          detail.badEncType = true;
        } else {
          detail.text = error.message;
        }
      } else if (error instanceof kcrypto.NotSupportedError) {
        detail.badEncType = true;
      } else if (error instanceof KDC.NetworkError ||
                 error instanceof KDC.ProtocolError) {
        detail.text = error.toString();
      } else {
        // Anything else is an internal error. Rethrow it.
        detail.text = 'Internal error: ' + error;
        rethrow = true;
      }
      button.disabled = false;
      window.dispatchEvent(new CustomEvent('webathena-alert', {detail: detail}));

      if (rethrow) {
        throw error;
      }
    }

    this.saveCCache();
    this.requestUpdate();
  }

  private _tktReqAllow = async () => {
    if (!this._ccache) {
      log('No ticket');
      this._tktReqDeny();
      return;
    }
    if (this._ccache[0].isExpired()) {
      log('Ticket expired');
      this._tktReqDeny();
      return;
    }

    try{
      const sessions = await Promise.all(this._tktReqData.services.map(async svc => {
        let svcString = svc.toString();
        if (svcString in this._ccacheIndex) {
          // If we have the service ticket cahced, use it.
          return this._ccache[this._ccacheIndex[svcString]];
        }
        // Get and cache the service ticket.
        let session = await KDC.getServiceSession(this._ccache[0], svc);
        let idx = this._ccache.push(session) - 1;
        this._ccacheIndex[svcString] = idx;
        return session;
      }));
      this.saveCCache();
      // log(sessions);

      if (this._tktReqData.returnList) {
        this._tktReqData.cb({
          status: 'OK',
          sessions: sessions.map((session:any) => {
            return session.toDict();
          })
        });
      } else {
        var session:any = sessions[0];
        this._tktReqData.cb({
          status: 'OK',
          session: session.toDict(),
        });
      }
    } catch (err) {
      log(err);
      this._tktReqDeny();
    }
 }

  private _tktReqDeny = (code?, message?) => {
    code = code || "NOT_ALLOWED";
    message = message || "The user did not approve the permission grant.";
    this._tktReqData.cb({
      status: "DENIED",
      code: code,
      message: message,
    })
  }

}
