const { ipcRenderer, remote } = require('electron');
const fs = require('fs-extra');
const mputils = require('./mailgun-putils.js');
const Mailgun = require('mailgun-js');


const sharedObj = remote.getGlobal('sharedObj');
const config = {
    "domain": sharedObj.CONFIG.MAILGUN_USR_DOMAIN || localStorage.getItem("MAILGUN_USR_DOMAIN"),
    "apiKey": sharedObj.CONFIG.MAILFUN_USR_APIKEY || localStorage.getItem("MAILFUN_USR_APIKEY")
}

var MicroModal = require('micromodal');
MicroModal.init();

var mailgun;
var domains = mputils.csvFinder();
var domainElement = document.querySelector("#usrDomain");
var apiKeyElement = document.querySelector("#usrApiKey");
var noticeTitle = document.querySelector("#notice-title");
var noticeMessage = document.querySelector("#notice-message");

if (config.domain) {
    domainElement.value = config.domain;
}
if (config.apiKey) {
    apiKeyElement.value = config.apiKey;
}

async function saveDataAsJSON(data, filename) {
    fse.writeJson(filename, data, err => {
      if (err) return console.error(err)
      console.log('Write to file (' + filename + ') success!');
    });
}


function setMailgun(apiKey, domain) {
    mailgun = Mailgun({ apiKey: apiKey, domain: domain });
}

function listDomains()  {
    domains = mputils.csvFinder();
}


function trigger_button() {
    var apiKey = apiKeyElement.value;
    var domain = domainElement.value;
    var config = {
        "MAILGUN_USR_DOMAIN": domain,
        "MAILFUN_USR_APIKEY": apiKey
    }
    noticeTitle.innerHTML = "Notice";
    noticeMessage.innerHTML = "Please wait a moment...";
    MicroModal.show("notice");
    try{
        setMailgun(apiKey, domain);
    } catch (err) {
        noticeTitle.innerHTML = "<div style='color: red'>Error!!!!</div>";
        noticeMessage.innerHTML = "<code>"+ err +"</code>";
        return false;
    }
    
    localStorage.setItem("MAILGUN_USR_DOMAIN", domain);
    localStorage.setItem("MAILGUN_USR_APIKEY", apiKey);
    var mcsvFetch = new mputils.MailgunCSVLog(mailgun, domain, apiKey);
    mcsvFetch.get_events((e) => {

        MicroModal.show("notice");
        if (e.statusCode < 300) {
            noticeTitle.innerHTML = "Notice";
            noticeMessage.innerHTML = e.statusMessage;
            saveDataAsJSON({
                    "MAILGUN_USR_DOMAIN": domain,
                    "MAILFUN_USR_APIKEY": apiKey
                },
                sharedObj["CONFIG_FILE_PATH"]
            );
        } else {
            noticeTitle.innerHTML = "<div style='color: red'>Error!!!!</div>";
            noticeMessage.innerHTML = e.statusMessage;
        }
    });
    return false;
}