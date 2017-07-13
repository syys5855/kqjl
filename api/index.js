var express = require('express');
var bodyParser = require('body-parser');
var db = require('../db/dbkq.js');
var apiUtils = require('./apiUtils.js');
var router = express.Router();


db.connect(function(err) {
    err && console.log(err);
});
db.setup(function(err) {
    err && console.log(err);
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

// 用户流水-添加 
router.post('/addUserWater.json', (req, res) => {
    let param = req.body;
    console.log('param--->', param);
    if (typeof param !== "object") {
        param = JSON.parse(req.body);
    }
    let keys = Object.keys(param);
    try {
        param = JSON.parse(keys);
    } catch (err) {
        res.send(apiUtils.JsonResponse('failure', '穿入参数错误'));
        return;
    }
    let {
        userId,
        openId,
        event,
        result,
        hostId,
        dateTime,
        createTime
    } = param;


    // 判断是否为空
    if (!userId || !hostId || !event) {
        res.send(apiUtils.JsonResponse('failure', 'error: userId,hostId,openId,event is empty'));
        return;
    }

    let ttime = (dateTime || apiUtils.toDateStr(new Date())).split(" ")[0].replace(/\//g, '');
    let tname = 'user_water_' + ttime;
    // 添加用户流水
    db.addUserWater(tname, userId, openId, hostId, event, result, dateTime, createTime, (err) => {
        if (err) {
            console.log(err);
            res.send(apiUtils.JsonResponse('failure', '添加失败'));
        } else {
            res.send(apiUtils.JsonResponse('success'));
        }
    });

    db.userIsexisted(userId, (err, data, user) => {
        // 添加新用户
        if (!err && !data) {
            db.addUser(userId, openId, createTime || dateTime, hostId, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('添加用户成功--->', userId);
                }
            })
        }
        // 更新用户的hostId,createTime
        else if (!err && data) {
            db.updateUserHostId(userId, hostId, user.createTime || createTime || dateTime, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('更新用户hostId成功--->%s->%s', userId, hostId);
                }
            });
        }
    });
});

// 盒子流水-添加
router.post('/addBoxWater.json', (req, res) => {
    let param = req.body;
    if (typeof param !== "object") {
        param = JSON.parse(req.body);
    }
    let keys = Object.keys(param);
    try {
        param = JSON.parse(keys);
    } catch (err) {
        res.send(apiUtils.JsonResponse('failure', '穿入参数错误'));
        return;
    }
    let {
        dateTime,
        version,
        event,
        result,
        hostId,
        hostIp,
        createTime
    } = param;

    // 判断是否为空
    if (!hostId || !event) {
        // 输出 JSON 格式
        res.send(apiUtils.JsonResponse('failure', 'error: hostId,hostIp,event is empty'));
        return;
    }

    let ttime = (dateTime || apiUtils.toDateStr(new Date())).split(" ")[0].replace(/\//g, '');
    let tname = 'box_water_' + ttime;
    // 添加盒子流水
    db.addBoxWater(tname, hostId, hostIp, version, event, result, dateTime, (err) => {
        if (err) {
            console.log(err);
            res.send(apiUtils.JsonResponse('failure', '添加失败'));
        } else {
            res.send(apiUtils.JsonResponse('success'));
        }
    });


    db.boxIsexisted(hostId, (err, data) => {
        // 添加新盒子
        if (!err && !data) {
            db.addBox(hostId, hostIp, createTime, version, dateTime, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('添加盒子成功--->', hostId);
                }
            });
        }
        // 更新盒子的时间和版和hostIp
        else if (!err && data && event === 'check_update') {
            db.updateBox(hostId, dateTime, version, hostIp, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('更新盒子时间成功--->%s->%s->%s', hostId, dateTime, version);
                }
            });
        }
    })
});

// 盒子流水-查询一个盒子的所有
router.get('/findBoxWaterById.json', (req, res) => {
    let {
        hostId: host,
        pageSize = 20,
        lastTime
    } = req.query;


    pageSize = parseFloat(pageSize);
    let timeStr = lastTime || apiUtils.toDateStr(new Date());
    db.pagination('box_water_', timeStr, host, pageSize, db.findBoxWaterById).then(datas => {
        res.send(apiUtils.JsonResponse('success', datas));
    }).catch(err => {
        console.error(err);
        res.send(apiUtils.JsonResponse('failure', err));
    });
});

// 盒子-查询所有
router.get('/findBoxAll.json', (req, res) => {
    db.findBoxAll((err, data) => {
        if (err) {
            res.send(apiUtils.JsonResponse('failure', '获取失败'));
        } else {
            let rst = apiUtils.JsonResponse('success', data);
            rst.time = Date.now();
            res.send(rst);
        }
    })
});


router.get('/findOneDayUserList.json', (req, res) => {
    let { date, hostId } = req.query;
    let ttime = date.replace(/\//g, ''),
        tname = "user_water_" + ttime;
    db.getOneDayRecord(tname, hostId, (err, datas) => {
        if (err) {
            res.send(apiUtils.JsonResponse('failure', '没有数据'));
        } else {
            res.send(apiUtils.JsonResponse('success', datas));
        }
    })
});


// 盒子-更新公司名字
router.post('/updateBoxCompanyName.json', (req, res) => {
    let { company, id } = req.body;
    if (!company || !id) {
        res.send(apiUtils.JsonResponse('failure', '参数错误'));
        return;
    }
    db.updateBoxCompanyName(company, id, (err) => {
        if (err) {
            console.log('updateBoxCompanyNameErr', err);
            res.send(apiUtils.JsonResponse('failure', '更新失败'));
        } else {
            res.send(apiUtils.JsonResponse('success', '更新成功'));
        }
    })
})

// 用户-单个盒子下的用户
router.get('/findBoxAllUser.json', (req, res) => {
    let {
        hostId
    } = req.query;
    db.findBoxAllUser(hostId, (err, data) => {
        if (err) {
            res.send(apiUtils.JsonResponse('failure', '获取失败'));
        } else {
            res.send(apiUtils.JsonResponse('success', data));
        }
    });
});

// 盒子-下面所有用户的流水
router.get('/findBoxUserWater.json', (req, res) => {
    let {
        hostId: host,
        pageSize = 20,
        lastTime
    } = req.query;

    pageSize = parseFloat(pageSize);
    let timeStr = lastTime || apiUtils.toDateStr(new Date());
    db.pagination('user_water_', timeStr, host, pageSize, db.findBoxWaterById).then(datas => {
        res.send(apiUtils.JsonResponse('success', datas));
    }).catch(err => {
        console.error(err);
        res.send(apiUtils.JsonResponse('failure', err));
    });
})

module.exports = router;