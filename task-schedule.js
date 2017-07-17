let schedule = require('node-schedule');

function initTask(func, delta = 5) {
    this.func = func;
    this.delta = delta;
}

initTask.prototype.run = function() {
    console.log('task run');
    let rule = this._init(this.delta);
    schedule.scheduleJob(rule, () => {
        this.func();
    })
}
initTask.prototype._init = function(delta) {
    let arr = [],
        count = 0,
        rule = new schedule.RecurrenceRule();
    while (count <= 60) {
        if (count % delta === 0) {
            arr.push(count);
        }
        count++;
    }
    rule.minute = arr;
    return rule;
}

// curl "http://sandbox.qingkaoqin.com/send2weixin?type=test_reportFault" -d '{"Hostid":"dkQmGbzUPHyq3ABfYZL_-W6o7Nr","touser":"onQbU0p6ADD0XEcwJNSbc7g4iqvc","keywords":["<杭州复睿>超时未上报状态","14:39:11"]}'
// let request = require('request');
// request({
//         method: 'post',
//         url: 'http://sandbox.qingkaoqin.com/send2weixin?type=test_reportFault',
//         headers: {
//             "content-type": "application/json",
//         },
//         body: '{ "Hostid": "dkQmGbzUPHyq3ABfYZL_-W6o7Nr", "touser": "onQbU0p6ADD0XEcwJNSbc7g4iqvc", "keywords": ["<杭州复睿>超时未上报状态", "14:59:11"] }'
//     },
//     function(error, response, body) {
//         console.log(error, response, response)
//     }
// );


module.exports = initTask;