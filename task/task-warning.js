let request = require('request');
let warnUrl = 'http://sandbox.qingkaoqin.com/send2weixin?type=test_reportFault';
// const notationers = ['onQbU0lhAjHknN5uI3PdEo1VhcN8', 'onQbU0p6ADD0XEcwJNSbc7g4iqvc', 'onQbU0o5-LUIp3s3Sq2F_tKAcb8k '];
const warnMsgs = ['<杭州复睿>超时未上报状态', '<杭州复睿>盒子的版本号异常'];

function warnCheckFun(lastState, notationers) {
    let now = Date.now(),
        nowDate = new Date(now);
    let state = Object.assign({}, lastState);
    console.log("start check");
    for (let [k, v] of Object.entries(state)) {
        let { version, dateTime } = v;
        if (!version || !version.split(",")[0] || (now - new Date(dateTime).getTime()) >= 5 * 60000) {
            notationers.forEach(nota => {
                let msg = (!version || !version.split(",")[0]) ? warnMsgs[1] : warnMsgs[0];
                notation({ Hostid: k, touser: nota, keywords: [msg, dateTime] })
            })
            console.log("warnCheckFun dangerous--->", k, JSON.stringify(v));
            delete state[k];
        }
    }
    return state;
}

function notation(param) {
    // '{ "Hostid": "dkQmGbzUPHyq3ABfYZL_-W6o7Nr", "touser": "onQbU0p6ADD0XEcwJNSbc7g4iqvc", "keywords": ["<杭州复睿>超时未上报状态", "14:59:11"] }'
    request({
            method: 'post',
            url: warnUrl,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(param)
        },
        function(error, response, body) {
            console.log(error, body);
        }
    );
}
module.exports = warnCheckFun;