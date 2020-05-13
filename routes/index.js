const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const router = require('koa-router')()
var svgCaptcha = require('svg-captcha')
const nodemailer = require('nodemailer')
const moment = require('moment')
const axios = require('axios')

const setToken = require('../token/index')
const getToken = require('../token/getToken')

const userSql = require('../allSqlStatement/userSql')
const paperSql = require('../allSqlStatement/paperSql')
const titleSql = require('../allSqlStatement/titleSql')
const practiceSql = require('../allSqlStatement/practiceSql')

const codeMap = new Map();

let transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: '3159172007',
    pass: 'pyvvsnxpippxdcfi'
  }
})

function sendMail (email, code) {
  const mailOptions = {
    from: '3159172007@qq.com',
    to: email,
    subject: 'SQL测试训练平台重置密码',
    html:  `<b>您的验证码为 <span style="color: red;">${code}</span>    </b>, 10分钟后过期。
    <br>
    此为系统邮件，请勿直接回复！`
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return
    }
  })
}

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

// 获取验证码
function getCaptcha () {
  var captcha = svgCaptcha.create({
    // 翻转颜色
    inverse: false,
    ignoreChars: '0o1i',
    // 字体大小
    fontSize: 50,
    // 噪声线条数
    noise: 2,
    // 宽度
    width: 100,
    // 高度
    height: 50,
    background: '#cc9966'
  })
  const value = captcha.text.toLowerCase()
  return {
    url: captcha.data,
    value
  }
}

router.get('/getValiteCode', async ctx => {
  const data = getCaptcha()
  ctx.response.type = 'image/svg+xml'
  return (ctx.body = {
    url: data.url,
    value: data.value
  })
})

// 校验信息
router.post('/checkInfo', async ctx => {
  const params = ctx.request.body
  if (!params.email) {
    return (ctx.body = {
      message: '邮箱不能为空',
      error: -1
    })
  }
  const status = params.status
  try {
    if (status === 0) {
      // 学生
      const list = await userSql.queryPasswordByStudentId(params.studentId)
      if (!list.length) {
        return (ctx.body = {
          message: '学号不存在',
          error: -1
        })
      }
      if (list[0].email !== params.email) {
        return (ctx.body = {
          message: '邮箱错误',
          error: -1
        })
      }
    } else {
      // 教师
      const list = await userSql.queryPasswordByWorkNumber(params.workNumber)
      if (!list.length) {
        return (ctx.body = {
          message: '工号不存在',
          error: -1
        })
      }
      if (list[0].email !== params.email) {
        return (ctx.body = {
          message: '邮箱错误',
          error: -1
        })
      }
    }
    const hash = Math.random()
    .toString(36)
    .substr(2).slice(0,6)
    codeMap.set(hash, new Date())
    sendMail(params.email, hash)
    return (ctx.body = {
      message: '正确',
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -1
    })
  }
})

// 校验邮箱验证码
router.post('/checkEmail', async ctx=> {
  const params = ctx.request.body
  const code = params.code
  if(codeMap.has(code)) {
    codeMap.delete(code)
    return ctx.body = {
      message: '成功',
      error: 0
    }
  }else {
    return ctx.body = {
      message: '验证码错误',
      error: -1
    }
  }
})
// 修改密码
router.post('/changePassword', async ctx => {
  const params = ctx.request.body
  try{
    if(params.status === 0) {
      // 学生
      await userSql.changeStudentPassword(params.id, params.password)
    }else {
      // 教师
      await userSql.changeWorkNumberPassword(params.id, params.password)
    }
    return ctx.body = {
      message: '修改成功',
      error: 0
    }
  }catch(e) {
    return ctx.body = {
      message: e.toString(),
      error: -2
    }
  }
})
module.exports = router
