import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import { bodyStyles, errorStyles } from '../constants/css';

export interface WebathenaAlertDetails {
  title: string;
  text: string | null;
  badEncType: boolean;
}

@customElement('webathena-alert')
export class WebathenaAlert extends LitElement {
  static styles = [
    errorStyles,
    bodyStyles,
    css`
      #alert td:first-child {
        text-align: center;
        font-size: 2em;
        padding-right: 0.3em;
        vertical-align: top;
      }
      #alert-content {
        text-align: left;
        max-width: 300px;
      }`,
    ];

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('webathena-alert', this._process_alert);
    window.addEventListener('webathena-dismiss-alert', this._dismiss_alert);
  }

  disconnectedCallback() {
    window.removeEventListener('webathena-dismiss-alert', this._dismiss_alert);
    window.removeEventListener('webathena-alert', this._process_alert);
    super.disconnectedCallback();
  }

  @property() title: string = '';
  @property() text: string = '';
  @property() badEncType: boolean = false;
  @property() hidden: boolean = true;

  private _process_alert = (event: CustomEvent) => {
    this.title = event.detail.title;
    this.text = event.detail.text;
    this.badEncType = event.detail.badEncType;
    this.hidden = false;
  }

  private _dismiss_alert = (event: Event) => {
    this.title = '';
    this.text = '';
    this.badEncType = false;
    this.hidden = true;
  }

  render_bad_etypes() {
    return html`
      <p>
        Please <a href="https://ca.mit.edu/ca/cpw" target="_blank">change your Athena password</a>.
      </p>
      <p>
        <small>
          Webathena was unable to choose encryption settings compatible with your Athena account.
          It is likely using old <a href="https://en.wikipedia.org/wiki/Data_Encryption_Standard" target="_blank">DES</a>-based
          keys known to be <em>weak and insecure</em>. Changing your password will generate newer, more secure keys.
        </small>
      </p>`;
  }

  render() {
    if (this.hidden) return '';

    var message = html``;
    if (this.badEncType) {
      message = this.render_bad_etypes();
    } else if (this.text) {
      message = html`${this.text}`;
    }

    return html`<table id="alert" class="error body">
      <tr>
        <td>&#x26A0;</td>
        <td id="alert-content">
          <b id="alert-title">${this.title}</b>
          <div id="alert-text">${message}</div>
        </td>
      </tr>
    </table>`;
  }
}
