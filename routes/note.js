
const express = require('express');
const router = express.Router();

const checkLogin = require('../middlewares/checklogin').checkLogin;
const isYourNote = require('../middlewares/isyou').isYourNote;
const isYourFollowNote = require('../middlewares/isyou').isYourFollowNote;

const noteModel = require('../database/noteModel');
const db = new noteModel();

function insertliked(arr1, arr2) {
  arr1.forEach(function (item1) {
    item1['recordliked'] = 0
    arr2.forEach(function (item2) {
      if (parseInt(item1.recordID) == parseInt(item2.recordID)) {
        item1.recordliked += 1;
      }
    })
  })
  return arr1;
}
function insertcomment(arr1, arr2) { //把评论内容内嵌到每一个record中
  arr1.forEach(function (item1) {
    item1['comment'] = [];
    item1['recordcomment'] = 0;
    arr2.forEach(function (item2) {
      if (parseInt(item1.recordID) == parseInt(item2.recordID)) {
        item1.comment.push(item2);
        item1.recordcomment += 1;
      }
    })
  })
  return arr1;
};
function adjusttime(arr) {
  arr.map(function (item) {
    return item.recordtime = item.recordtime.toLocaleString();
  })
  return arr;
}

router.get('/:noteID', checkLogin, isYourNote, isYourFollowNote, function (req, res) {
  var noteID = parseInt(req.params.noteID);
  db.init();
  var likedArray = new Array();
  var recordArray = new Array();
  var commentArray = new Array();
  var sessionPart = {
    userID: req.session.user.userID,
    nickname: req.session.user.nickname,
    userPtoUrl: req.session.user.userPtoUrl
  };
  var notePart, recordPart = new Array();
  db.searchNote(noteID, function (err, result) {
    if (err) {
      res.json({ "ret_code": 2 });
    } else {
      notePart = Object.create(result[0]);
      db.searchfollow(noteID, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          notePart['followcount'] = result[0].notefollow;
        }
      });
      db.searchliked(noteID, function (err, result) {
        if (err) {
          console.log(err);
          res.json({ "ret_code": 2 });
        } else {
          likedArray = result.concat();
          notePart['likedcount'] = likedArray.length;
          db.searchRecord(noteID, function (err, result) {
            if (err) {
              res.json({ "ret_code": 2 });
            } else {
              recordcount = result.length;
              notePart['recordcount'] = recordcount;
              console.log(notePart);
              recordArray = result.concat();
              recordArray = adjusttime(recordArray);
              recordArray = insertliked(recordArray, likedArray);
              db.searchComment(noteID, function (err, result) {
                if (err) {
                  res.json({ "ret_code": 2 });
                } else {
                  notePart['commentcount'] = result.length;
                  commentArray = result.concat();
                  recordPart = insertcomment(recordArray, commentArray);
                  console.log(recordPart);
                  db.end();
                  res.render('note', {
                    checknote: req.isyournote,
                    checkfollow: req.isyourfollownote,
                    notepart: notePart,
                    sessionpart:sessionPart,
                    recordpart: recordPart
                  });
                }
              });
            };
          });
        }
      })
    }
  });
});

router.post('/:noteID/deleterecord', checkLogin, isYourNote, function (req, res) {
  db.init();
  db.deleteRecord(
    req.body.recordID,
    function (err, result) {
      if (err) {
        console.log(err);
        res.json({ "ret_code": 2 });
      } else {
        res.json({ "ret_code": 0 });
      }
    });
});

router.post('/:noteID/addrecord', checkLogin, isYourNote, function (req, res) {
  db.init();
  db.addRecord(
    parseInt(req.params.noteID),
    req.body.recordContent,
    req.session.user.userID,
    function (err, result) {
      if (err) {
        console.log(err);
        res.json({ "ret_code": 2 });
      } else {
        res.json({ "ret_code": 0 });
      }
    });
});

router.post('/:noteID/delete', checkLogin, isYourNote, function (req, res) {
  db.init();
  db.deletenote(req.params.noteID, function (err, result) {
    if (err) {
      console.log(err);
      res.json({ "ret_code": 2 })
    } else {
      res.json({ "ret_code": 0, "userID": req.session.user.userID });
    }
  });
});


module.exports = router;