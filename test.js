let request = require('request');
let co = require('co');
let origin = 'http://localhost:2334';

function exec() {
    return new Promise((res, rej) => {
        request({
            method: 'get',
            url: origin + '/api/findBoxAll.json'
        }, function(error, response, body) {
            if (error) {
                rej(error);
            } else {
                let result = JSON.parse(body);
                res(result.items);
            }
        });
    })
}


function* gen() {
    let items = yield exec();
    return items;
}

co(gen()).then(rst => {
    console.log(rst);
})