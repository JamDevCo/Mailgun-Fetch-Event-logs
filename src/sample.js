const fs = require('fs-extra');
const mputils = require('./mailgun-putils.js');

const events = fs.readJsonSync('./data/events-sample.json')

// Events required; Rejected, Failed (Permanent or temporary)
// Fields required: recipient,delivery status message,timestamp

const config = {
    "domain": "dpkjm.com",
    "apikey": "aa5f6"
}
var mailgun = mputils.MailgunCSVLog(config.domain, config.apikey);
mailgun.save_events(events);