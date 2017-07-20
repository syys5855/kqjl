var express = require('express');
var path = require('path');
var app = new express();
var proxy = require('http-proxy-middleware');
require('babel-core/register');
let api = require('./api');


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/box-list.html'));
});
app.use('/api', api);
app.use(express.static('static'));
var server = app.listen('2333', function() {
    console.log('start at ', server.address().address, server.address().port);
})