const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

var app = express();
app.use(cookieParser())
app.use('/map-editor', (req, res, next) => {
    let auths = Object.keys(JSON.parse(fs.readFileSync(__dirname + "/auths.json")).active);
    let auth = req.cookies.auth;

    if (auths.includes(auth)) {
        next();
    } else {
        res.redirect('/');
    }
});

verifyCookie = (req, res, next) => {
    let auths = Object.keys(JSON.parse(fs.readFileSync(__dirname + "/auths.json")).active);
    let auth = req.cookies.auth;

    if (auths.includes(auth)) {
        next();
    } else {
        res.status(401).send();
    }
}

app.use(express.static('public'));
app.use(express.static('public/map-editor'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/territories.json', (req, res) => {
    res.sendFile(__dirname + "/territories.json");
});

app.post('/add-country', [verifyCookie], (req, res) => {
    if (!req.query.territory) return;
    if (!req.query.country) return;

    console.log("Adding " + req.query.country + " to " + req.query.territory);

    let territories = JSON.parse(fs.readFileSync(__dirname + '/public/territories.json'));
    if (!territories[req.query.territory]) return;

    for (let territory in territories) {
        if (territories[territory].countries.includes(req.query.country)) {
            let i = territories[territory].countries.indexOf(req.query.country);
            territories[territory].countries.splice(i, 1);
        }
    }

    territories[req.query.territory].countries.push(req.query.country);
    fs.writeFileSync(__dirname + '/public/territories.json', JSON.stringify(territories, null, 2));

    res.status(200).send();
});

app.post('/add-fragment', [verifyCookie], (req, res) => {
    if (!req.query.territory) return;
    if (!req.query.fragmentName) return;
    if (!req.body.coords) return;

    console.log("Adding " + req.query.fragmentName + " to " + req.query.territory);

    let territories = JSON.parse(fs.readFileSync(__dirname + '/public/territories.json'));
    if (!territories[req.query.territory]) return;

    territories[req.query.territory].fragments[req.query.fragmentName] = req.body.coords;
    fs.writeFileSync(__dirname + '/public/territories.json', JSON.stringify(territories, null, 2));

    res.status(200).send();
});

app.post('/remove-country', [verifyCookie], (req, res) => {
    if (!req.query.country) return;

    let territories = JSON.parse(fs.readFileSync(__dirname + '/public/territories.json'));

    for (let territory in territories) {
        if (territories[territory].countries.includes(req.query.country)) {
            let i = territories[territory].countries.indexOf(req.query.country);
            territories[territory].countries.splice(i, 1);
        }
    }

    fs.writeFileSync(__dirname + '/public/territories.json', JSON.stringify(territories, null, 2));

    res.status(200).send();
});

app.post('/remove-fragment', [verifyCookie], (req, res) => {
    if (!req.query.fragmentName) return;

    let territories = JSON.parse(fs.readFileSync(__dirname + '/public/territories.json'));

    for (let territory in territories) {
        if (Object.keys(territories[territory].fragments).includes(req.query.fragmentName)) {
            delete territories[territory].fragments[req.query.fragmentName];
        }
    }

    fs.writeFileSync(__dirname + '/public/territories.json', JSON.stringify(territories, null, 2));

    res.status(200).send();
});

app.get('/authorize', (req, res) => {
    if (!req.query.auth) return;

    let auths = JSON.parse(fs.readFileSync(__dirname + "/auths.json"))
    if (!Object.keys(auths.pending).includes(req.query.auth)) return;

    auths.active[req.query.auth] = auths.pending[req.query.auth];
    delete auths.pending[req.query.auth]; 

    fs.writeFileSync(__dirname + '/auths.json', JSON.stringify(auths, null, 2));

    res.cookie("auth", req.query.auth);
    res.send("Your have been authorized. You can now navigate away from this page.");
});

app.listen(4000);
