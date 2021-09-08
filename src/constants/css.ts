import {css} from 'lit';

export const errorStyles = css`
.error {
  padding: 4pt;
  box-shadow: 2pt 2pt 5pt black;
  border-radius: 12pt;
  background: darkorange;
  background: linear-gradient(to bottom, orange, darkorange);
}`;

export const bodyStyles = css`
.body {
  margin: auto;
  margin-top: 1.7em;
  padding: 0.85em;
  max-width: 500px;
}
.body > p {
  margin: 0.5em 0 0.5em 0;
}
.body > p:first-child {
  margin-top: 0;
}
.body > p:last-child {
  margin-bottom: 0;
}`;

export const webathenaStyles = css`
table.form-box {
  margin: 0 auto 0 auto;
  text-align: left;
}
table.form-box > tbody > tr > td:first-child {
  padding-right: 0.5em;
  text-align: right;
}
table.form-box > tbody > tr > td:only-child {
  padding: 0;
  text-align: center;
}
.login {
  box-shadow: 1pt 1pt 4pt black;
  background: #ddd;
  background: linear-gradient(to bottom, #eee, #ccc);
}
.login-message {
  text-align: center;
}
div.logout {
  text-align: right;
}
div.logout > a {
    font-size: 0.8em;
}
.login .container {
  position: relative;
}
.login td {
  height: 30pt;
}
.login input {
  border: 1px solid #888;
  border-radius: 2px;
  font-family: 'PT Mono', monospace;
  font-size: 14pt;
}
.login .error {
  position: absolute;
  top: -4pt;
  left: 100%;
  margin-left: 4pt;
  white-space: pre;
}
button {
  width: 100%;
  font-family: 'Alegreya', serif;
  font-size: 1em;
}
.authed {
  text-align: center;
  box-shadow: 1pt 1pt 4pt black;
  background: #ddd;
  background: -moz-linear-gradient(top, #eee, #ccc);
  background: -webkit-linear-gradient(top, #eee, #ccc);
  background: -o-linear-gradient(top, #eee, #ccc);
  background: linear-gradient(to bottom, #eee, #ccc);
}
.authed .client-principal {
  margin-bottom: 1em;
}
.identifier {
  font-family: 'PT Mono', monospace;
  font-size: 18pt;
}
.button-box > button {
  width: 48%;
  margin: 0 1% 0 1%;
  float: left;
}
.button-box::after { clear: both; content: ""; display: block; }
.permission-list {
  text-align: left;
  margin-top: 0;
}
.permission-list > li.dangerous {
  font-weight: bold;
  list-style-image: url(../images/dangerous.png);
}
.authed .client-principal {
    margin-bottom: 1em;
}
`;
