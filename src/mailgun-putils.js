
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const fse = require('fs-extra');
const moment = require('moment');
const path = require('path');


const data_dir = path.join(
    __dirname,
    "data"
).replace("resources\\app.asar\\src\\", "");
const CONFIG_FILE_PATH = path.join(data_dir, 'config.json');


async function saveDataAsJSON(data, filename, override) {
    if(fse.pathExistsSync(filename) && !override) {
        console.log("File already exists: " + filename);
    } else {
        fse.writeJson(filename, data, err => {
          if (err) return console.error(err)
          console.log('Write to file (' + filename + ') success!');
        });
    }
}

function getStoredCSV() {
    var storedFiles = path.join(data_dir, 'files.json');
    if (fse.pathExistsSync(storedFiles)) {
        return fse.readJsonSync(path.join(data_dir, 'files.json'));
    }
    return {};
}

function csvFinder () {
    var records = {};
    var files = fs.readdirSync(data_dir);
    files.forEach(domain => {
        var domain_filepath = path.join(data_dir, domain);
        if ( fs.lstatSync(domain_filepath).isDirectory() ) {
            records[domain] = [];
            try {
                var subFiles = fs.readFileSync(domain_filepath);
                subFiles.forEach(event_log => {
                    if (path.extname(event_log) == ".csv") {
                        var event_log_filepth = path.join(domain_filepath, event_log);
                        records[domain].push(event_log_filepth);
                    }
    
                });
            } catch (err) {
                // console.log(err);
            }
        }
    });
    console.log("Domains:")
    console.log(records);
    return records;
};



class MailgunCSVLog {

    constructor(mailgun, domain, apiKey) {
        this.mailgun = mailgun;
        this.domain = domain;
        this.apiKey = apiKey;
        this.statusCode = 200;
        this.statusMessage = '';
    }

    format_csv_events(events) {
        var records = [];
        events['items'].forEach(item => {

            var delivery_code = 200
            var delivery_status = '';
            var recipients = [];
            var reason = '';
            var subject_id = item.message.headers['message-id'];

            try {
                recipients = item.message.recipients.join('; ');
            } catch (err) {
                recipients = item.recipient;
            }

            console.log(subject_id);
            if (item.reason != undefined) {
                reason = item.reason;
            }

            if (item.hasOwnProperty('delivery-status')) {
                delivery_code = item['delivery-status']['code'];
                delivery_status = item['delivery-status']['message'];
            }

            records.push({
                "event": item.event,
                "recipients": recipients,
                "delivery-code": delivery_code,
                "delivery-status": delivery_status,
                "reason": reason,
                "timestamp": item.timestamp,
                "subject-id": subject_id,
                "subject": item.message.headers.subject,
                "sender": item.message.headers.from
            });
        });
        return records;
    }

    save_events(events) {

        const data = this.format_csv_events(events);
        if (data.length == 0) {
            return "No records found";
        }

        const domain_dir = path.join(
            data_dir,
            this.domain
        );

        fse.ensureDirSync(domain_dir, {mode: 0o2775});

        const filepath = path.join(
            domain_dir,
            "events-" + moment().format("DD-MM-YYYY-hh_mm_ss") + ".csv"
        );

        const header = [
            {id: 'event', title: 'Event'},
            {id: 'recipients', title: 'Recipients'},
            {id: 'delivery-status', title: 'Delivery Status'},
            {id: 'delivery-code', title: 'Delivery Code'},
            {id: 'reason', title: 'Reason'},
            {id: 'timestamp', title: 'Timestamp'},
            {id: 'subject-id', title: 'Subject ID'},
            {id: 'subject', title: 'Subject'},
            {id: 'sender', title: 'Sender'},
        ]
        const csvWriter = createCsvWriter({
            path: filepath,
            header: header
        });

        var return_msg = 'Got ' + data.length + " records.\n "
            + 'The CSV file was written successfully to ' + filepath;
        csvWriter
            .writeRecords(data)
            .then(()=> console.log(
                return_msg
            ));
        console.log(return_msg);
        return return_msg;
    }


     get_events(callback) {
        var csvlogger = this;
        this.mailgun.get(
            `/${csvlogger.domain}/events`,
            {"event": "rejected OR failed"},
            (error, events) => {        
                console.log(error, events);        
                if (error != undefined ) {
                    csvlogger.statusMessage = events.message;
                    csvlogger.statusCode = error.statusCode;
                    console.log(events.message);
                } else if (!events.hasOwnProperty('items')) {
                    csvlogger.statusMessage = events.message;
                    csvlogger.statusCode = 400;
                    console.log(events.message);
                } else {
                    csvlogger.statusCode = 200;
                    csvlogger.statusMessage = csvlogger.save_events(events);
                    saveDataAsJSON({
                            "MAILGUN_USR_DOMAIN": csvlogger.domain,
                            "MAILFUN_USR_APIKEY": csvlogger.apiKey
                        },
                        CONFIG_FILE_PATH,
                        false
                    );
                }
                if (typeof callback === "function") {
                    callback(csvlogger);
                }
            }
        );
    }

    track_webhook() {
        var csvlogger = this;
        this.mailgun.get(`/domain/${csvlogger.domain}/webhooks`,
            (error, events) => {
                csvlogger.save_events(events);
            }
        );
    }

};


exports.MailgunCSVLog = MailgunCSVLog;
exports.csvFinder = csvFinder;
exports.data_dir = data_dir;
exports.CONFIG_FILE_PATH = CONFIG_FILE_PATH;