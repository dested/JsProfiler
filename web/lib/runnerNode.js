console.log('a');
var express = require('express');
var app = express();
var cors = require('cors')
var vm = require('vm');


app.use(cors());


app.use(function (req, res, next) {
    var contentType = req.headers['content-type'] || '',
        mime = contentType.split(';')[0];

    if (mime != 'text/plain') {
        return next();
    }

    var data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        req.rawBody = data;
        next();
    });
});

var calls=0;
app.post('/getTimer', function (req, res) {
    calls++;
    var code = req.rawBody;
    var sandbox={code: code, getTimer: getTimer};
    vm.runInNewContext('this.timer = this.getTimer(this.code);', sandbox);
    res.json(sandbox.timer);
});

app.listen(1000);




function error(er) {
    console.log(er);
}

function getTimer(code) {

        var Instrumenter = require('./inst.js');
        var instrumenter = new Instrumenter({
            noCompact: true,
            debug: true
        });
        var timeIt;
        try {
            var changed;
            changed = instrumenter.instrumentSync(code, 'filename.js');

            changed = '(function(){' + changed + ';return timeMe})()';


            timeIt = eval(changed);

        } catch (exc) {
            error(exc.stack);
            console.log(changed);
            return;
        }



        var timer;

        try {
            timer = timeIt();

        } catch (exc) {
            error(exc.stack);
            return;
        }

        return timer;
    } 


    setInterval(function(){
        console.log('going ' + calls);
    },5000);