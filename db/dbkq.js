var sqlite3 = require('sqlite3');
var apiUtils = require('../api/apiUtils.js');
var db = undefined;
var defaultHostId = 'dkQmGbzUPHyq3ABfYZL_-W6o7Nr';
exports.connect = function(callback) {
    db = new sqlite3.Database("./db/dbkq.sqlite3", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        function(err) {
            if (err) {
                util.log('FAIL on creating database ' + err);
                callback(err);
            }
        });
}

exports.setup = function(callback) {
    let todayStr = apiUtils.toDateStr(new Date());
    todayStr = todayStr.split(' ')[0].replace(/\//g, '');
    // 盒子
    db.run('CREATE TABLE IF NOT EXISTS box(id VARCHAR(32) PRIMARY KEY,hostIp VARCHAR(32),createTime VARCHAR(32),version VARCHAR(32),dateTime VARCHAR(32),company VARCHAR(128));', (err) => {
        callback(err);
    });
    // 用户表 
    db.run('CREATE TABLE IF NOT EXISTS user(id VARCHAR(32) PRIMARY KEY,openId VARCHAR(32),createTime VARCHAR(32),hostId VARCHAR(32));', err => {
        callback(err);
    });
    // 盒子流水表 event:{1:check_update,2:set_update} result:{1:check_udpate,2:set_update}
    db.run('CREATE TABLE IF NOT EXISTS box_water_' + todayStr + '(id INTEGER PRIMARY KEY AUTOINCREMENT,hostId VARCHAR(32),hostIp VARCHAR(32),version VARCHAR(43),event VARCHAR(32),result VARCHAR(32),dateTime VARCHAR(32));', err => {
        callback(err);
    });
    // 用户流水表 event:{1:push_request,2:subscribe,3:subscribe_webacht} result:{1:push_success,2:unsubscribe}
    db.run('CREATE TABLE IF NOT EXISTS user_water_' + todayStr + '(id INTEGER PRIMARY KEY AUTOINCREMENT,userId VARCHAR(32),openId VARCHAR(32),hostId VARCHAR(32),event VARCHAR(32),result VARCHAR(32),dateTime VARCHAR(32),createTime VARCHAR(32));', (err) => {
        callback(err);
    });

    // 用户权限表
    db.run('CREATE TABLE IF NOT EXISTS user_authority(userId VARCHAR(32),hostId VARCHAR(32),warn VARCHAR(1),FOREIGN KEY(userId) REFERENCES  user(id),FOREIGN KEY(hostId) REFERENCES box(id),PRIMARY KEY(userId,hostId));', err => {
        callback(err);
    });
}

// 用户-添加
exports.addUser = function(userId, openId, createTime, hostId, callback) {
    db.run('INSERT INTO user VALUES(?,?,?,?);', [userId, openId, createTime, hostId], (err) => {
        callback(err);
    })
}

// 用户-更新 hostId
exports.updateUserHostId = function(userId, hostId, createTime, callback) {
    db.run('UPDATE user SET hostId=?,createTime=? where id=?', [hostId, createTime, userId], (err) => {
        callback(err);
    })
}

// 用户-判断用户是否存在
exports.userIsexisted = function(userId, callback) {
    db.get('SELECT * FROM user where id=?', userId, (err, data) => {
        console.log(data);
        if (err) {
            callback(err)
        } else {
            callback(null, data && Object.keys(data).length > 0, data);
        }
    });
}

// 盒子-添加
exports.addBox = function(hostId, hostIp, createTime, version, dateTime, callback) {
    db.run('INSERT INTO box (id, hostIp, createTime, version, dateTime) VALUES (?,?,?,?,?);', [hostId, hostIp, createTime, version, dateTime], (err) => {
        callback(err);
    })
}

// 盒子-更新最后的上报时间和版本
exports.updateBox = function(hostId, dateTime, version, hostIp, callback) {
    if (hostIp) {
        db.run('UPDATE  box set dateTime=?,version=?,hostIp=? where id=?', [dateTime, version, hostIp, hostId], (err) => {
            callback(err);
        });
    } else {
        db.run('UPDATE  box set dateTime=?,version=? where id=?', [dateTime, version, hostId], (err) => {
            callback(err);
        });
    }
}

// 盒子-判断是否存在
exports.boxIsexisted = function(boxId, callback) {
    db.get('SELECT COUNT(*) FROM box where id=?;', boxId, (err, data) => {
        if (err) {
            callback(err)
        } else {
            callback(null, data['COUNT(*)'] > 0);
        }
    })
}

// 盒子-所有盒子的Id	
exports.findAllBoxHostId = function(callback) {
    db.all('SELECT id FROM box', (err, data) => {
        callback(err, data)
    });
}

// 用户-单个盒子下的用户
exports.findBoxAllUser = function(hostId, callback) {
    db.all('SELECT * FROM user where hostId = ?;', [hostId], (err, data) => {
        callback(err, data);
    })
}

exports.findAllUserId = function(callback) {
    db.all('SELECT id FROM user;', (err, data) => {
        callback(err, data);
    })
}

// 用户流水-添加 
exports.addUserWater = function(tname, userId, openId, hostId, event, result, dateTime, createTime, callback) {
    db.run(`INSERT INTO ${tname} values(?,?,?,?,?,?,?,?);`, [null, userId, openId, hostId, event, result, dateTime, createTime], (err) => {
        callback(err);
    })
}

// 盒子流水-添加
exports.addBoxWater = function(tname, hostId, hostIp, version, event, result, dateTime, callback) {
    db.run(`INSERT INTO ${tname} values(?,?,?,?,?,?,?);`, [null, hostId, hostIp, version, event, result, dateTime], (err) => {
        callback(err);
    })
};

exports.findBoxWaterById = function(tname, hostId, lastTime, many) {
    return new Promise((res, rej) => {
        db.all(`SELECT * FROM ${tname} where hostId=? and dateTime < ? order by dateTime desc limit ?;`, [hostId, lastTime, many], (err, data) => {
            if (err) {
                console.error(err);
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

// 盒子-查询所有
exports.findBoxAll = function(callback) {
    db.all('SELECT * FROM box order by dateTime desc;', (err, data) => {
        callback(err, data);
    });
}

// 盒子-根据条件查询
// 考勤记录的人数
exports.findBoxList = (tableName, activityNum = 0) => {
    return new Promise((res, rej) => {
        db.all(`SELECT * from box where id in (SELECT hostId from ${tableName}  GROUP BY hostId  having count(DISTINCT userId)>=?) order by dateTime desc;`, activityNum, (err, data) => {
            err ? rej(err) : res(data);
        });
    });
}

// 盒子-获取每一天盒子下的活跃用户
exports.findBoxAllActivity = (tableName) => {
    return new Promise((res, rej) => {
        db.all(`SELECT box.*,ifnull(tac.num,0) as num from box left join (SELECT count(DISTINCT userId) as num ,hostId from ${tableName} GROUP BY hostId) as tac on tac.hostId = box.id;`, (err, data) => {
            err ? rej(err) : res(data);
        });
    })
}


// 盒子-下面所有用户的流水
exports.findBoxUserWater = function(tname, hostId, lastTime, many) {
    return new Promise((res, rej) => {
        db.all(`SELECT * FROM ${tname} where hostId=? and dateTime < ? order by dateTime desc limit ?;`, [hostId, lastTime, many], (err, data) => {
            err ? rej(err) : res(data);
        });
    });
}


// 盒子-更新公司的名字
exports.updateBoxCompanyName = function(company, id, callback) {
    db.run('UPDATE box set company =? where id=?;', [company, id], (err) => {
        callback(err);
    })
}

// 用户流水-获取最大，最小时间和openid
exports.getOneDayRecord = function(tableName, hostId, callback) {
    db.all(`SELECT min(dateTime) as firstTime, max(dateTime) as lastTime,userId,openId from ${tableName} where hostId=? GROUP by userId;`, [hostId], (err, data) => {
        callback(err, data);
    })
}

/**
 * tableName {string} 不包含日期的表名
 * timeStr {string} yyyyMMdd
 * hostId 
 * all {number} 需要多少条
 * func {function} 返回Promise的查询函数
 */
exports.pagination = function pagination(tableName, timeStr, hostId, all, func) {
    let ttime = timeStr.split(" ")[0].replace(/\//g, ''),
        tname = tableName + ttime;
    return new Promise((reslove, rej) => {
        isExists(tname).then(exits => {
            if (!exits) {
                reslove([]);
                return;
            }
            func(tname, hostId, timeStr, all).then((datas) => {
                if (datas.length < all) {
                    let timeDate = new Date(timeStr);
                    let date = new Date(timeDate.getTime() - 24 * 60 * 60 * 1000);
                    let dateStr = apiUtils.toDateStr(date).split(" ")[0];
                    let timestr = apiUtils.toDateStr(new Date(`${dateStr} 23:59:59`));
                    pagination(tableName, timestr, hostId, all - datas.length, func).then(dts => {
                        reslove([...datas, ...dts]);
                    }).catch(err => {
                        console.log(err);
                        reslove([...datas])
                    });
                } else {
                    reslove([...datas]);
                }
            }).catch(err => {
                console.log(err);
                reslove([]);
            });
        });
    });

    function addZero(num) {
        return num < 10 ? '0' + num : num + '';
    }

    function isExists(table) {
        return new Promise((res, rej) => {
            db.get(`select * from ${table} limit 1;`, (err, data) => {
                if (err) {
                    res(false);
                } else {
                    res(true);
                }
            });
        })
    }
}

// 通过hostId 来获取盒子信息
exports.findBoxById = (id) => {
    return new Promise((res, rej) => {
        db.get(`select * from box where id = ?`, id, (err, data) => {
            err ? rej(err) : res(data);
        })
    });
}


// 获取用户的权限
exports.findAllUserAuthority = (hostId = defaultHostId) => {
    return new Promise((res, rej) => {
        db.all('select u.*, ua.warn as warn from user as u left join  user_authority as ua on u.id=ua.userId where u.hostId=?', hostId, (err, data) => {
            err ? rej(err) : res(data);
        })
    })
}

// 添加一个接收告警通知
exports.addUserAuthorityWarn = (userId, hostId = defaultHostId) => {
    return new Promise((res, rej) => {
        db.run('INSERT INTO user_authority (hostId,userId,warn) VALUES(?,?,?);', [hostId, userId, '1'], (err) => {
            err ? rej(err) : res(null);

        });
    });
}

exports.removeUserAuthorityWarn = (userId, hostId = defaultHostId) => {
    return new Promise((res, rej) => {
        db.run('DELETE FROM user_authority WHERE  hostId = ? and userId =? ;', [hostId, userId], (err) => {
            err ? rej(err) : res(null);
        });
    });
}

// 获取所有有接收告警的用户
exports.findAllUserAuthorityWarn = (hostId = defaultHostId) => {
    return new Promise((res, rej) => {
        db.all('SELECT u.* from user_authority as ua left join user as u on ua.userId=u.id where ua.warn =? and u.hostId=?;', ['1', hostId], (err, data) => {
            err ? rej(err) : res(data);
        });
        // 'onQbU0p6ADD0XEcwJNSbc7g4iqvc', 'onQbU0qn9ndcS9SVNanIzv5N7u1I', 'onQbU0n9cTiRr2DBHwlKqL_zminc', 'onQbU0isUkygYcI3oKdIU37LlGj4'
        // res([]);
    });
}

// 检测每个正常运行的公司，检测其用户流水
exports.findExceptionBoxs = (dayStr, event) => {
    return new Promise((res, rej) => {
        db.all(`select * from box where id not in (select distinct hostId from user_water_${dayStr} where event = ?) and id in (SELECT distinct hostId from box_water_${dayStr} where event = 'check_update' and version like '_%,%');`, event, (err, data) => {
            err ? rej(err) : res(data);
        });
    });
}

exports.isExists = (table) => {
    return new Promise((res, rej) => {
        db.get(`select * from ${table} limit 1;`, (err, data) => {
            if (err) {
                res(false);
            } else {
                res(true);
            }
        });
    })
}