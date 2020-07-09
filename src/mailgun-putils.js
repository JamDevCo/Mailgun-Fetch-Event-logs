
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const fse = require('fs-extra');
const moment = require('moment');
const path = require('path');


const data_dir = path.join(
    __dirname,
    "data"
);

async function saveDataAsJSON(data, filename) {
    fse.writeJson(filename, data, err => {
      if (err) return console.error(err)
      console.log('Write to file (' + filename + ') success!');
    });
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
            var recipients = item.message.recipients.join('; ');

            if (item.hasOwnProperty('delivery-status')) {
                delivery_code = item['delivery-status']['code'];
                delivery_status = item['delivery-status']['message'];
            }

            records.push({
                "event": item.event,
                "recipients": recipients,
                "delivery-code": delivery_code,
                "delivery-status": delivery_status,
                "timestamp": item.timestamp,
                "subject-id": item.message.headers['message-id'],
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
        return return_msg;
    }


     get_events(callback) {
        var csvlogger = this;
        this.mailgun.get(
            `/${csvlogger.domain}/events`,
            { "ascending": "yes", "limit": 300},
            (error, events) => {
                csvlogger.statusCode = error.statusCode;
                if (error.statusCode == 401) {
                    csvlogger.statusMessage = events.message;
                    console.log(events.message);
                } else if (!events.hasOwnProperty('items')) {
                    csvlogger.statusMessage = events.message;
                    csvlogger.statusCode = 400;
                    console.log(events.message);
                } else {
                    csvlogger.statusMessage = "Got " + events.items.length + " items";
                    csvlogger.statusCode = 200;
                    csvlogger.save_events(events);
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