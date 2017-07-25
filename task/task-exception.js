// 异常公司
let request = require('request');
let warnUrl = 'http://sandbox.qingkaoqin.com/send2weixin?type=test_reportFault';
// const notationers = ['onQbU0lhAjHknN5uI3PdEo1VhcN8', 'onQbU0qn9ndcS9SVNanIzv5N7u1I ', 'onQbU0p6ADD0XEcwJNSbc7g4iqvc', 'onQbU0o5-LUIp3s3Sq2F_tKAcb8k '];
const warnMsgs = ['公司推送异常'];

function sendMsg(boxInfo, notationers) {
    // notationers = ['onQbU0p6ADD0XEcwJNSbc7g4iqvc', 'onQbU0qn9ndcS9SVNanIzv5N7u1I', 'onQbU0n9cTiRr2DBHwlKqL_zminc', 'onQbU0isUkygYcI3oKdIU37LlGj4'];
    // notationers = ['onQbU0p6ADD0XEcwJNSbc7g4iqvc', 'onQbU0lhAjHknN5uI3PdEo1VhcN8'];
    notationers = ['onQbU0p6ADD0XEcwJNSbc7g4iqvc', 'onQbU0qn9ndcS9SVNanIzv5N7u1I', 'onQbU0n9cTiRr2DBHwlKqL_zminc', 'onQbU0isUkygYcI3oKdIU37LlGj4'];
    let { company, dateTime, id: hostId } = boxInfo;
    notationers.forEach(nota => {
        let msg = `<${company}>${warnMsgs[0]}`;
        notation({ Hostid: hostId, touser: nota, keywords: [msg, dateTime] })
    });
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
            console.log('param-->', JSON.stringify(param), error, body);
        }
    );
}
module.exports = sendMsg;