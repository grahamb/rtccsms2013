/* jshint node:true */

var NODE_ENV = process.env.NODE_ENV || 'development',
    http = require('http'),
    config = require('./config.json'),
    twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token),
    team_numbers = config.team_numbers[NODE_ENV];

process.title = 'rtccsms2013';

function postbody2obj(str) {
    var arr = str.split('&');
    var obj = {};
    arr.forEach(function(item) {
        item = item.split('=');
        obj[item[0]] = decodeURIComponent(item[1].replace(/\+/g, " "));
    });
    return obj;
}

function rebroadcast(message) {
    var newbody = 'From ' + team_numbers[message.From] + ': ' + message.Body;
    var numbers = Object.keys(team_numbers);

    if (NODE_ENV === 'production') {
        numbers.splice(numbers.indexOf(message.From), 1);
    }

    numbers.forEach(function(number) {
        console.log("Should send %s to %s", newbody, number);
        twilio.sendSms({
            to: number,
            from: config.twilio.outbound_number,
            body: newbody
        }, function(err, responseData) {
            if (err) { console.log('ERROR %s', err); }
        });
    });

}

function pong(message) {
    twilio.sendSms({
        to: message.From,
        from: config.twilio.outbound_number,
        body: 'Pong'
    }, function(err, responseData) {
        if (err) { console.log('ERROR %s', err); }
    });
}

process.on('uncaughtException', function(err) {
    console.error(err.stack);
});


http.createServer(function(req, res) {
    var message, fromNumber, fromName;

    if (req.method === 'GET') {
        res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        res.write('hello');
        res.end();
        return;
    }

    req.on('data', function(chunk) {
        var message = postbody2obj(chunk.toString());
        if (team_numbers.hasOwnProperty(message.From)) {
            rebroadcast(message);
        }
    });

    req.on('end', function() {
        res.writeHead(200, "OK", {'Content-Type': 'text/html'});
        res.end();
    });

}).listen(2013);
console.log('%s server running on port 2013', NODE_ENV);

