
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs-extra');
const moment = require('moment');
const path = require('path');

class MailgunCSVLog {

    constructor(domain, apiKey) {
        this.domain = domain;
        this.apiKey = apiKey;
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

        const domain_dir = path.join(
            __dirname,
            "data",
            this.domain
        );
        fs.ensureDirSync(domain_dir);

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

        const data = this.format_csv_events(events);
        csvWriter
            .writeRecords(data)
            .then(()=> console.log(
                'The CSV file was written successfully to ' + filepath
            ));
    }


     get_events() {
        mailgun.get(
            `/${DOMAIN}/events`,
            { "ascending": "yes", "limit": 300},
            (error, data) {
                console.log(body);
            }
        );
    }

    track_webhook() {
        mailgun.get(`/domain/${DOMAIN}/webhooks`, (error, body) {
            console.log(body);
        });
    }

};


exports.MailgunCSVLog = MailgunCSVLog