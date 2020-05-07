const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = require('koa-router')();
const nodemailer = require('nodemailer');
const moment = require('moment');
const axios = require('axios');

const userSql = require('../allSqlStatement/studentSql');

let transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: '1360023821',
    pass: 'zrqdhmlmweamijgc',
  }
});

// const mailOptions = {
//   from: '1360023821@qq.com',
//   // to: 'msFee40000@163.com',
//   to: 'yuki2072@163.com',
//   subject: '邮件测试',
//   html: fs.createReadStream(path.resolve(__dirname, 'test.html'))
// }

// transporter.sendMail(mailOptions, (err, info) => {
//   if(err) {
//     console.log(err);
//     return;
//   }
//   console.log('发送成功');
// })



module.exports = router;
