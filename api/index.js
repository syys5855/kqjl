var express = require('express');
var bodyParser = require('body-parser');
var db = require('../db/dbkq.js');
var apiUtils = require('./apiUtils.js');
var router = express.Router();
let schedule = require('node-schedule');
let writeXlsx = require('../task/export-activity.js');

// 盒子最后活跃的状态
// {hostId:{dateTime,version},...}
let boxLastState = {};
(() => {
    let errFun = console.error;
    let logFun = console.log;
    console.error = function(...param) {
        errFun.apply(null, [new Date().toLocaleString(), ...param]);
    }
    console.log = function(...param) {
        logFun.apply(null, [new Date().toLocaleString(), ...param]);
    }

    Date.prototype.addDays = function(days) {
        let now = this;
        return new Date(now.getTime() + days * 24 * 60 * 60000);
    }
})();

db.connect(function(err) {
    if (!err) {

    } else {
        err && console.log(err);
    }
});
db.setup(function(err, db) {
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
    if ((!userId && !openId) || !hostId || !event) {
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
            if (version && version.split(',')[0] && event === 'check_update') {
                // 在 任务中过滤无效的数据
                boxLastState[hostId] = {
                    dateTime,
                    version
                };
            }
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
        else if (!err && data && event === 'check_update' && version && version.split(',')[0]) {
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

// 盒子-根据活跃人数来查询
router.get('/findBoxList.json', (req, res) => {
    let today = new Date(),
        todayStr = apiUtils.toDateStr(today),
        ttime = todayStr.split(' ')[0].replace(/\//g, ''),
        { type = 'day', num = 0, download = false, fileName = '在线统计.xlsx', dateStr = ttime } = req.query;
    let tname = 'user_water_' + dateStr;
    num = isNaN(+num) ? 0 : +num;

    switch (type) {
        case 'day':
            handleDay(tname, num).then(data => {
                download ? exportFile(data, num, fileName) : (res.send(successData(data)));
            }).catch(err => {
                res.send(apiUtils.JsonResponse('failure', err));
            });
            break;
        case 'week':
            handleWeek(today, num).then(data => {
                download ? exportFile(data, num, fileName) : (res.send(successData(data)));
            }).catch(err => {
                res.send(apiUtils.JsonResponse('failure', err));
            });
            break;
        case 'month':
            handleMonth(today, num).then(data => {
                download ? exportFile(data, num, fileName) : (res.send(successData(data)));
            }).catch(err => {
                res.send(apiUtils.JsonResponse('failure', err));
            });
            break;
    }

    async function handleDay(tableName, num) {
        let exist = await db.isExists(tableName);
        let data = [];
        if (exist) {
            data = await db.findBoxList(tableName, num);
        }
        return data;
    }

    // 获取一天的每个盒子的活跃人数
    async function findBoxAllActivity(tableName) {
        let exist = await db.isExists(tableName);
        let data = [];
        if (exist) {
            data = await db.findBoxAllActivity(tableName);
        }
        return data;
    }

    // 计算平均值
    function getAverage(datas) {
        let obj = {},
            len = datas.length,
            rst = [];
        datas.forEach(adDatas => {
            adDatas.forEach(dt => {
                let { id, num } = dt;
                if (!obj.hasOwnProperty(id)) {
                    obj[id] = {
                        num: 0,
                        boxInfo: dt
                    };
                }
                obj[id].num += num;
            });
        });
        for (let [key, value] of Object.entries(obj)) {
            rst.push({
                boxInfo: value.boxInfo,
                average: Math.floor(value.num / len)
            });
        }
        return rst;
    }

    async function handleWeek(today, num) {
        let weekdayNow = today.getDay() || 7;
        let date = new Date(today.getTime());
        let dates = [];
        while (weekdayNow-- > 0) {
            dates.push(date);
            date = date.addDays(-1);
        }
        let pArr = [];
        for (let dt of dates) {
            dt = apiUtils.toDateStr(dt).split(" ")[0].replace(/\//g, '');
            let _tname = 'user_water_' + dt;
            pArr.push(findBoxAllActivity(_tname, num));
        }
        let datas = await Promise.all(pArr);
        datas = getAverage(datas);
        // 过滤信息
        let rst = [];
        datas.forEach(dt => {
            if (dt.average >= num) {
                dt.boxInfo.num = dt.average;
                rst.push(dt.boxInfo);
            }
        })
        return rst;
    }

    async function handleMonth(today, num) {
        let monthDate = today.getDate();
        let date = new Date(today.getTime());
        let dates = [];
        while (monthDate-- > 0) {
            dates.push(date);
            date = date.addDays(-1);
        }
        let pArr = [];
        for (let dt of dates) {
            dt = apiUtils.toDateStr(dt).split(" ")[0].replace(/\//g, '');
            let _tname = 'user_water_' + dt;
            pArr.push(findBoxAllActivity(_tname, num));
        }
        let datas = await Promise.all(pArr);
        datas = getAverage(datas);
        // 过滤信息
        let rst = [];
        datas.forEach(dt => {
            if (dt.average >= num) {
                dt.boxInfo.num = dt.average;
                rst.push(dt.boxInfo);
            }
        })
        return rst;
    }

    function exportFile(data, wantedNum, fileName) {
        let title = ['公司名字', '盒子ID', '上线人数'];

        let content = data.map(dt => {
            let { company, id, num } = dt;
            return [company, id, num];
        });

        writeXlsx.write([
            title,
            ...content
        ], fileName).then(filePath => {
            res.download(filePath);
        }).catch(err => {
            res.send(apiUtils.JsonResponse('failure', err));
        });
    }

    function successData(data) {
        let rst = apiUtils.JsonResponse('success', data);
        rst.time = Date.now();
        return rst;
    }
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
});

// 获取用户权限
router.get('/findAllUserAuthority.json', (req, res) => {
    db.findAllUserAuthority().then(data => {
        res.send(apiUtils.JsonResponse('success', data))
    }).catch(err => {
        res.send(apiUtils.JsonResponse('failure', '获取失败'));
        console.error('findAllUserAuthorityErr', err);
    })
});

// 用户添加警报权限
router.post('/addUserAuthorityWarn.json', (req, res) => {
    let { userId } = req.body;
    if (!userId) {
        console.log('addUserAuthorityWarnErr->userId', userId);
        res.send(apiUtils.JsonResponse('failure', 'userId和hostId不能为空'));
        return;
    }
    db.addUserAuthorityWarn(userId).then(() => {
        res.send(apiUtils.JsonResponse('success', '添加成功'));
    }).catch(err => {
        console.error('addUserAuthorityWarnErr', err)
        res.send(apiUtils.JsonResponse('failure', '操作失败'));
    });
});

// 用户删除警报权限
router.post('/removeUserAuthorityWarn.json', (req, res) => {
    let { userId } = req.body;
    if (!userId) {
        console.log('removeUserAuthorityWarnErr->userId', userId);
        res.send(apiUtils.JsonResponse('failure', 'userId不能为空'));
        return;
    }
    db.removeUserAuthorityWarn(userId).then(() => {
        res.send(apiUtils.JsonResponse('success', '操作成功'));
    }).catch(err => {
        console.error('removeUserAuthorityWarnErr' + err);
        res.send(apiUtils.JsonResponse('failure', '操作失败'));
    });
});

// 查询异常盒子
router.get('/findExceptionBoxs.json', (req, res) => {
    let { dateStr } = req.query;
    let todayStr = apiUtils.toDateStr(new Date());
    todayStr = todayStr.split(' ')[0].replace(/\//g, '');
    db.findExceptionBoxs(dateStr || todayStr, 'push_request_login').then(data => {
        res.send(apiUtils.JsonResponse('success', data));
    }).catch(err => {
        res.send(apiUtils.JsonResponse('failure', err));
    })
});

// 日周月导出excel
router.get('/exportActivity.json', (req, res) => {
    writeXlsx.write([
        [1, 2, 3],
        [5, 6, 7, 8, 9]
    ], 'haha.xlsx').then(filePath => {
        console.log(filePath);
        res.download(filePath);
    }).catch(err => {
        res.send(apiUtils.JsonResponse('failure', err));
    });
});

// 更新盒子是否 接收推送
router.post('/updateBoxRecWarn.json', (req, res) => {
    let param = req.body,
        { hostId, status } = param;

    db.updateBoxRecWarn(hostId, status).then(() => {
        res.send(apiUtils.JsonResponse('success'));
    }).catch(err => {
        res.send(apiUtils.JsonResponse('failure', '更新失败'));
    });
});


// 报警的定时任务
! function() {
    let scheduleWarn = require('../task-schedule.js')
    let warnFun = require('../task/task-warning.js');
    new scheduleWarn(function() {
        // 获取企业相关信息
        let preState = Object.assign({}, boxLastState),
            pArr = [];
        Object.keys(preState).forEach(hostId => {
            pArr.push(db.findBoxById(hostId));
        });

        Promise.all(pArr).then(boxs => {
            boxs.forEach(box => {
                let { company, id: hostId, recwarn } = box;
                preState[hostId].company = company;
                if (recwarn === 'false' || !recwarn) {
                    delete preState[hostId];
                }
            });

            // 因为推送用户写死的
            boxLastState = warnFun(preState);
            console.log('check done-->', JSON.stringify(boxLastState));

            // db.findAllUserAuthorityWarn().then((users) => {
            //     users = [];
            //     let warnOpenIds = users.map(user => {
            //         return user.openId;
            //     });
            //     console.log('warnOpenIds', JSON.stringify(warnOpenIds));
            //     boxLastState = warnFun(preState, warnOpenIds);
            //     console.log('check done-->', JSON.stringify(boxLastState));

            // }).catch(err => {
            //     console.error('定时任务失败:获取通知用户失败');
            // });
        }).catch(err => {
            console.error('获取企业信息错误');
        });

    }, 1).run();
    console.log('findAllUserAuthorityWarnSchduleRun');
}();

// 每天上午九点半检测每个盒子正常运行
! function() {
    let rule = new schedule.RecurrenceRule();
    rule.hour = 9;
    rule.minute = 30;
    schedule.scheduleJob(rule, () => {
        let sendMsg = require('../task/task-exception.js');
        let todayStr = apiUtils.toDateStr(new Date());
        todayStr = todayStr.split(' ')[0].replace(/\//g, '');
        db.findExceptionBoxs(todayStr, 'push_request_login').then(boxsInfo => {
            boxsInfo.forEach(boxInfo => {
                sendMsg(boxInfo);
            });
            console.log('findExceptionBoxsDone-->', JSON.stringify(boxsInfo));
        }).catch(err => {
            console.log('findExceptionBoxsErr', err);
        })
    });
    console.log('findExceptionBoxsSchduleRun');
}();

// 每个月28号创建下个月的表
! function() {
    let rule = new schedule.RecurrenceRule(),
        nextMonth = new Date(Date.now() + 10 * 24 * 3600 * 1000),
        nextMDayStr = apiUtils.getMonthDays(nextMonth);

    rule.date = 28;
    rule.hour = 1;
    rule.second = 30;
    console.log('CreateNextMonthTableSchduleRun');
    schedule.scheduleJob(rule, () => {
        let pArr = [];
        for (let dstr of nextMDayStr) {
            pArr.push(db.createNextMonth(dstr));
        }
        Promise.all(pArr).catch(err => {
            console.log('下一个月盒子流水、用户流水创建失败', err);
        }).then(() => {
            console.log('下一个月盒子流水、用户流水创建成功');
        });
    });
}();


module.exports = router;