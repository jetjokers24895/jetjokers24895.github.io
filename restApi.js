var express = require('express');
var Webtask = require('webtask-tools');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

app.get('/reset', function (req, res) {
    req.webtaskContext.storage.get((err, data) => {
        //res.send(data);
        data = {"admin":"homebuilderdev"}
        req.webtaskContext.storage.set(data, function (error) {
                if (error) return res.send({ "err": error });
                res.sendStatus(200);
            });
    })

});

app.post('/add-user', addUser);

app.post('/login', login);

function addUser(req, res) {
    let pwdAdmin = req.body.pwdAdmin;
    let name = req.body.name;
    let pw = req.body.password;
    req.webtaskContext.storage.get(function (error, data) {
        let approveAdd = true;
        if (error) return error;
        let names = Object.keys(data);
        approveAdd = names.indexOf(name) > -1 || data["admin"] !== pwdAdmin ? false : true;
        if (approveAdd === true) {
            data[name] = pw;
            req.webtaskContext.storage.set(data, function (err) {
                if (err) return res.send({ "err": err });
                res.sendStatus(200);
            });
        } else {
            res.sendStatus(500);
        }

    });
}

function login(req, res) {
    let name = req.body.name;
    let pw = req.body.password;
    req.webtaskContext.storage.get(function (err, data) {
        let stt = true;
        stt = typeof data[name] === 'undefined' || data[name] !== pw ? false : true;
        if (stt === true) {
            res.send({
                "name" : name
            })
        } else {
            res.sendStatus(500)
        }
    })
}

module.exports = Webtask.fromExpress(app);
