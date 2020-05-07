const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const router = require('koa-router')()
const nodemailer = require('nodemailer')
const moment = require('moment')
const axios = require('axios')

const userSql = require('../allSqlStatement/userSql')

let transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: '1360023821',
    pass: 'zrqdhmlmweamijgc'
  }
})

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

// 学生、教师注册接口
router.post('/register', async ctx => {
  const params = ctx.request.body
  const status = params.status
  try {
    const isEmail = await userSql.queryEmail(params.email, status);
    if(isEmail.length) {
      return ctx.body = {
        message: '该邮箱已经存在，注册失败',
        error: -1
      }
    }
    if (status == 0) {
      // 学生注册
      const isExit = await userSql.queryPasswordByStudentId(params.studentId)
      if (isExit.length) {
        return (ctx.body = {
          message: '该学号已经存在，注册失败',
          error: -1
        })
      }
      await userSql.addStudent(params)
      return (ctx.body = {
        error: 0,
        message: '恭喜注册成功!'
      })
    } else {
      // 教师注册
      const isExit = await userSql.queryPasswordByWorkNumber(params.workNumber)
      if (isExit.length) {
        return (ctx.body = {
          message: '该工号已经存在，注册失败',
          error: -1
        })
      }
      await userSql.addTeacher(params)
      return (ctx.body = {
        error: 0,
        message: '恭喜注册成功!'
      })
    }
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

module.exports = router
