const fs = require('fs-extra');
const mputils = require('./mailgun-putils.js');
const Mailgun = require('mailgun-js');

const events = fs.readJsonSync('./data/events-sample.json')

// Events required; Rejected, Failed (Permanent or temporary)
// Fields required: recipient,delivery status message,timestamp

const config = {
    "domain": process.env.MAILGUN_USR_DOMAIN || "example.com",
    "apiKey": process.env.MAILFUN_USR_APIKEY || 'example'
}

mputils.csvFinder();

var mailgun = require('mailgun-js')({ apiKey: config.apiKey, domain: config.domain });
var mailgun = new mputils.MailgunCSVLog(mailgun, config.domain, config.apikey);
mailgun.get_events();