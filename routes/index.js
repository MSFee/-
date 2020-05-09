const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const router = require('koa-router')()
const nodemailer = require('nodemailer')
const moment = require('moment')
const axios = require('axios')

const setToken = require('../token/index')
const getToken = require('../token/getToken')

const userSql = require('../allSqlStatement/userSql')
const paperSql = require('../allSqlStatement/paperSql')
const titleSql = require('../allSqlStatement/titleSql')
const practiceSql = require('../allSqlStatement/practiceSql')
const complateTitleSql = require('../allSqlStatement/complateTitleSql')

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
//     console.log(err)
//     return
//   }
//   console.log('发送成功')
// })

// 学生、教师注册接口
router.post('/register', async ctx => {
  const params = ctx.request.body
  const status = params.status
  try {
    const isEmail = await userSql.queryEmail(params.email, status)
    if (isEmail.length) {
      return (ctx.body = {
        message: '该邮箱已经存在，注册失败',
        error: -1
      })
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

// 学生、教师登录接口
router.post('/login', async ctx => {
  const params = ctx.request.body
  const status = params.status
  try {
    if (status == 0) {
      const isStudentId = await userSql.queryPasswordByStudentId(
        params.studentId
      )
      if (!isStudentId.length) {
        return (ctx.body = {
          message: '不存在该学号',
          error: -1
        })
      }
      const password = isStudentId[0].password
      if (password !== params.password) {
        return (ctx.body = {
          message: '密码错误',
          error: -1
        })
      }
      const token = setToken(params, status)
      // 学生登录
      return (ctx.body = {
        message: '登录成功',
        token: token,
        error: 0
      })
    } else {
      const isWorkNumber = await userSql.queryPasswordByWorkNumber(
        params.workNumber
      )
      if (!isWorkNumber.length) {
        return (ctx.body = {
          message: '不存在该工号',
          error: -1
        })
      }
      const password = isWorkNumber[0].password
      if (password !== params.password) {
        return (ctx.body = {
          message: '密码错误',
          error: -1
        })
      }
      const token = setToken(params, status)
      // 教师登录
      return (ctx.body = {
        message: '登录成功',
        token: token,
        error: 0
      })
    }
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 获取所有的试卷信息
router.get('/getAllPaperList', async ctx => {
  try {
    const list = await paperSql.queryAllPaperList()
    return (ctx.body = {
      list,
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 获取某个试卷下的所有题目信息
router.get('/getAllTitle', async ctx => {
  const paperId = ctx.query.paperId
  if (!paperId) {
    return (ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    })
  }
  try {
    const list = await titleSql.queryAllTitleByPaperId(paperId)
    list.map(item => {
      item.createTime = moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
    })
    return (ctx.body = {
      list,
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})


module.exports = router
