# This project is obsolete as websites have implemented new security measures to prevent web crawling

In memory screen scraper of new houses at Funda.nl

# Warning!

In order to run program you need to add your own config.js to the folder. Sample content:

```
var config = {};

config.host = 'gmail.com'; //smtp endponint of your email
config.emailUser = 'emailusername'; //username of email account
config.pass = 'emailpassword'; //password for email account
config.mailFrom = 'from@email.com'; //field Mail From 
config.mailTo = 'sample@email.com'; //field Mail To


exports.config = config;
```