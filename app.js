#!/usr/bin/env node

console.log("Starting looking for house");

var http = require('http');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var config = require('config');

var options = {
    host: 'www.funda.nl',
    path: '/huur/amsterdam/+10km/700-1150/sorteer-datum-af/'
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
    return function() {
        console.log(new Date() + " New check in progress");
        http.get(options, function (res) {
            res.setEncoding("utf8");
            var content = "";
            res.on("data", function (chunk) {
                content += chunk;
            });

            res.on("end", function () {
                var $ = cheerio.load(content);
                $('ul.object-list > li > a.object-media-wrapper ').each(function (index, element) {
                    if (housingOffers.indexOf(element.attribs.href) < 0) {
                        console.log(new Date() + " Found new house: " + element.attribs.href);
                        housingOffers.push(element.attribs.href)
                        if (sendEmail) {
                            sendEmailFunction(element.attribs.href);
                        }
                    }
                });
            });
        });
    };
};

var interval = setInterval(refreshHousingData(true), 1000 * 60 * 60);

var stdin = process.openStdin();
refreshHousingData(false)();

stdin.addListener("data", function (d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    clearInterval(interval);
    console.log("Exiting application");
    process.exit();
});