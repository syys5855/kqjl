-- 盒子 
CREATE TABLE IF NOT EXISTS box(id VARCHAR(32) PRIMARY KEY,hostIp VARCHAR(32),createTime VARCHAR(32),version VARCHAR(32),dateTime VARCHAR(32));
-- 用户表 
CREATE TABLE IF NOT EXISTS user(id VARCHAR(32) PRIMARY KEY,openId VARCHAR(32),createTime VARCHAR(32),hostId VARCHAR(32),FOREIGN KEY(hostId) REFERENCES box(id));


-- 盒子流水表 event:{1:check_update,2:set_update,3:pull_waiqin_data,4:report_ip} result:{1:check_udpate,2:set_update}
CREATE TABLE IF NOT EXISTS box_water(id INTEGER PRIMARY KEY AUTOINCREMENT,hostId VARCHAR(32),hostIp VARCHAR(32),version VARCHAR(43),event VARCHAR(32),result VARCHAR(32),dateTime VARCHAR(32));


-- 用户流水表 event:{1:push_request,2:subscribe,3:subscribe_webacht,4:waiqin_checkin,5:bind_user,6:view,7:push_result} result:{1:push_success,2:unsubscribe}
CREATE TABLE IF NOT EXISTS user_water(id INTEGER PRIMARY KEY AUTOINCREMENT,userId VARCHAR(32),openId VARCHAR(32),hostId VARCHAR(32),event VARCHAR(32),result VARCHAR(32),dateTime VARCHAR(32),createTime VARCHAR(32));


-- INSERT INTO box_water (id,dateTime,version,event,result,hostid) values(null,1493123959938,'v1.0.0','1','1','hostid1');
-- INSERT INTO box_water (id,dateTime,version,event,result,hostid) values(null,1493125156945,'v1.0.0','2','2','hostid1');
-- INSERT INTO box_water (id,dateTime,version,event,result,hostid) values(null,1493125207251,'v1.0.0','1','2','hostid1');
-- INSERT INTO box_water (id,dateTime,version,event,result,hostid) values(null,1493125220482,'v1.0.1','1','2','hostid2');


-- 找出最近活跃的
-- SELECT * from box_water bw where bw.dateTime=(SELECT max(dateTime) from box_water _bw where bw.hostid = _bw.hostid) order by bw.hostid;

-- 用户流水
-- INSERT INTO user_water values(null,1493170527325,'testuserid00001','testboxid00001',1,1);	

-- -- 盒子流水
-- INSERT INTO box_water values(null,1493170527325,'v1.0.0',1,1,'testboxid00001');



-- SELECT * from box_water where hostId='testboxid00001';


-- UPDATE box_water set hostId='testboxid00001' where id=5;



-- SELECT * from user where hostId='testboxid00001';

-- -- 绑定用户
-- INSERT INTO user values('testuserid00003','testopenid00003',1493170527325,'testboxid00001');	
-- INSERT INTO user values('testuserid00004','testopenid00004',1493170527325,'testboxid00002');	




SELECT * from user_water where hostId='testboxid00230' order by id desc limit 0,4;



UPDATE box set id ='hostIdTestAbcd' where id ='testboxid00001';