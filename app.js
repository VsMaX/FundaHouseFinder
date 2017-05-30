#!/usr/bin/env node

console.log("Starting looking for house");

var http = require('http');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var config = require('./config');
var _ = require('lodash');

if(!config) {
    console.log("Missing config.js file! Exiting application!");
    process.exit(1);
}

var options = {
    host: 'www.funda.nl',
    path: '/huur/amsterdam/+10km/700-1250/sorteer-datum-af/'
};

var housingOffers = [];

var sendEmailFunction = function (houseUrl) {

    // create reusable transporter object using the default SMTP transport
    var transportOptions = {
        host: config.host,
        port: 465,
        secure: true,
        auth: {
            user: config.emailUser,
            pass: config.pass
        }
    }
    var transporter = nodemailer.createTransport(transportOptions);

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: config.mailFrom, // sender address
        to: config.mailTo, // list of receivers
        subject: 'New Huse offer at Funda', // Subject line
        text: "There's new house available on funda, you can find it here: www.funda.nl" + houseUrl // plaintext body
    };


    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
};

var refreshHousingData = function (sendEmail) {
    return function () {
        console.log(`${new Date()}: New check in progress`);

        http.get({
            hostname: requestOptionsUrl,
            path: requestOptionsPath
        }, function (res) {
            res.setEncoding("utf8");
            var content = "";
            res.on("data", chunk => {
                content += chunk;
            });
            res.on("end", () => {
                var $ = cheerio.load(content);
                console.log(`${new Date()}: Finished downloading website`);
                console.log(content);
                $('div.search-result-header > a ').each(function (index, element) {
                    var potentialNewItem = {
                        date: new Date(),
                        houseUrl: element.attribs.href
                    };
                    console.log(`${new Date()}: Found potentially new house: ${potentialNewItem.houseUrl}`)
                    if (!_.some(housingOffers, item => item.houseUrl == potentialNewItem.houseUrl)) {
                        console.log(`${new Date()}: Found new house: ${potentialNewItem.houseUrl}`);
                        housingOffers.push(potentialNewItem);
                        if (sendEmail) {
                            sendEmailFunction(element.attribs.href);
                        }
                    }
                });
            });
            res.on('error', error => {
                console.log(`${new Date()}: ${error}`);
            });
        });
    };
};

var interval = setInterval(refreshHousingData(true), 1000 * 60 * 60 * 3);

var stdin = process.openStdin();
var requestOptionsUrl = process.env.HOUSE_FINDER_URL || options.host;
var requestOptionsPath = process.env.HOUSE_FINDER_PATH || options.path;

console.log(`requestOptionsUrl: ${requestOptionsUrl}`);
console.log(`requestOptionsPath:  ${requestOptionsPath}`);

refreshHousingData(false)();

stdin.addListener("data", function (d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    clearInterval(interval);
    console.log("Exiting application");
    process.exit();
});

//Express app
const express = require('express')
const app = express()

app.get('/', function (req, res) {
    res.sendStatus(200);
})

app.get('/houses', function(req, res) { //sends all housing offers from the beginning
    res.send(housingOffers);
});

app.listen(8080, function () {
    console.log('Funda house finder healthcheck works on port 8080!')
})

