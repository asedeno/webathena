import {html} from 'lit';

export const webathenaWarning = html`
<p>Webathena manages your Athena login for you using the Kerberos protocol. Your password never leaves your computer.
  <strong>Never enter your password into websites other than
    <a href="https://ca.mit.edu" target="_blank"><code>ca.mit.edu</code></a>,
    <a href="https://okta.mit.edu" target="_blank"><code>okta.mit.edu</code></a>,
    <a href="https://idp.mit.edu" target="_blank"><code>idp.mit.edu</code></a>, or
    <a href="https://webathena.mit.edu" target="_blank"><code>webathena.mit.edu</code></a>.
  </strong>
</p>`;
