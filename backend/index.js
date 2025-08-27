var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();
app.use(cors());
var jsonParser = bodyParser.json({ limit: '50mb', extended: true })
// var urlencodedParser = bodyParser.urlencoded({ limit: '20mb', extended: false })

let vehicles = null;
let buildings = null;
let educations = null;

app.post('/api/game/buildings', jsonParser, function (req, res) {
    buildings = req.body;
    res.send({ status: 'ok' });
});
app.get('/api/game/buildings', function (req, res) {
    res.send(buildings);
});

app.post('/api/game/vehicles', jsonParser, function (req, res) {
    vehicles = req.body;
    res.send({ status: 'ok' });
});
app.get('/api/game/vehicles', function (req, res) {
    res.send(vehicles);
});

app.post('/api/game/educations', jsonParser, function (req, res) {
    educations = req.body;
    res.send({ status: 'ok' });
});
app.get('/api/game/educations', function (req, res) {
    res.send(educations);
});

app.listen(1515);
console.log('Listening on port 1515...');