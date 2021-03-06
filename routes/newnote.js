const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const checkLogin = require('../middlewares/checklogin').checkLogin;
/* 
  上传文件的中间件以及修改文件名的模块
*/
const multer = require('multer');
var createFolder = function (folder) {
  try {
    fs.accessSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
};
var uploadFolder = './uploads/';
createFolder(uploadFolder);
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg');
  }
});
var upload = multer({ storage: storage });


router.get('/', checkLogin, function (req, res) {
  var sessionPart = {
    userID: req.session.user.userID,
    nickname: req.session.user.nickname,
    userPtoUrl: req.session.user.userPtoUrl
  };
  res.render('newnote', { sessionpart: sessionPart });
});

var cpUpload = upload.fields([{ name: 'noteCover' }, { name: 'noteIntroduction' }, { name: 'noteTitle' }])

router.post('/', checkLogin, cpUpload, function (req, res) {
  var noteTitle = req.body.noteTitle;
  var noteIntroduction = req.body.noteIntroduction;
  var noteCoverUrl = '/' + req.files['noteCover'][0].filename;
  var userID = req.session.user.userID; // session
  var noteModel = require('../database/noteModel');
  var db = new noteModel();
  db.init();
  db.newNote(userID, noteTitle, noteIntroduction, noteCoverUrl, function (err, result) {
    console.log(userID);
    if (err) {
      console.log(err);
      res.json({ "ret_code": 2, "ret_msg": "创建失败" });
    }
    res.json({ "ret_code": 0, "ret_msg": "创建记本成功", "userID": userID });
  });

});


module.exports = router;