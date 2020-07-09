const fse = require('fs-extra');
const mputils = require('./mailgun-putils.js');
const Mailgun = require('mailgun-js');

var config = {
    "domain": process.env.MAILGUN_USR_DOMAIN || "example.com",
    "apiKey": process.env.MAILGUN_USR_APIKEY || 'example',
    "useEnvOnly": process.env.APP_USE_ENV_ONLY || 'f'
}

if (config.useEnvOnly == 'f'){
    fse.ensureDir(mputils.data_dir, {mode: 0o2775});
    if (fse.pathExistsSync(mputils.CONFIG_FILE_PATH)) {
        jsConfig = fse.readJsonSync(mputils.CONFIG_FILE_PATH);
        if (config.domain != undefined) {
            config.domain = process.env.MAILGUN_USR_DOMAIN || jsConfig.MAILGUN_USR_DOMAIN;
        }
        if (config.apiKey != undefined) {
            config.apiKey = process.env.MAILFUN_USR_APIKEY || jsConfig.MAILGUN_USR_APIKEY;
        }
    }
}

var mailgun = require('mailgun-js')({ apiKey: config.apiKey, domain: config.domain });
var mailgun = new mputils.MailgunCSVLog(mailgun, config.domain, config.apikey);
mailgun.get_events();