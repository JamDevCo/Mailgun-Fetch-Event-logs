const fs = require('fs-extra');
const mputils = require('./mailgun-putils.js');

const events = fs.readJsonSync('./data/events-sample.json')

// Events required; Rejected, Failed (Permanent or temporary)
// Fields required: recipient,delivery status message,timestamp

mputils.save_events(events);