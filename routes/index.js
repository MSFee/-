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
      item.createTime = moment(item.createTime).format('YYYY-MM-DD hh:mm:ss');
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

// 学生完成题目接口
router.post('/completeTitle', async ctx => {
  const params = ctx.request.body
  const titleId = params.titleId
  const answer = params.answer.trim()
  if (!titleId) {
    return (ctx.body = {
      message: '题目ID不能为空',
      error: -1
    })
  }
  if (!answer) {
    return (ctx.body = {
      message: '答案不能为空',
      error: -1
    })
  }

  const methodsFlag = answer.split(' ')[0];

  let title = await titleSql.queryInfoById(titleId) // 查询正确的答案
  const trueAnswer = title[0].answer;
  if(trueAnswer.split(' ')[0] !== methodsFlag) {
    return ctx.body = {
      errormessage: '您所提交的答案与题目要求不一致',
      score: 0,
      isRight: false,
      error: 0
    }
  }
  if (methodsFlag !== 'select') {
    // 非查询操作
    const arr = answer.split(' ');
    const tem = arr.filter(item => {
      if(item.indexOf("_info") !== -1) {
        return item;
      }
    })
    if(!tem.length) {
      return ctx.body = {
        errormessage: '您所提交的答案与题目要求不一致',
        score: 0,
        isRight: false,
        error: 0
      }
    }
    const hash = Math.random().toString(36).substr(2);
    const hash2 = Math.random().toString(36).substr(2);
    const tableName = tem[0]+hash; // 生成临时随机表的表名
    const tableName_Teacher = tem[0] + hash2; // 生成教师执行sql临时表
    await practiceSql.createTemTable(tableName, tem[0]);
    let result = await practiceSql.queryDataTemTable(tableName); // 查询临时表数据
    await practiceSql.deleteTemTable(tableName); // 删除临时表
    return ctx.body = {
      list: result
    }
  } else {
    // 查询操作
    let result = null
    let flag = true // 判断该题是否做对了
    let errormessage = null
    let trueResult = null

    try {
      result = await practiceSql.perform(answer)
      trueResult = await practiceSql.perform(trueAnswer)
    } catch (e) {
      flag = false // 表明该题错误
      errormessage = e.toString()
    }
    // 提交结果和正确结果不相同
    if (JSON.stringify(result) !== JSON.stringify(trueResult)) {
      flag = false
    }

    // 该题错误的返回结果
    if (!flag) {
      return (ctx.body = {
        errormessage: errormessage ? errormessage : '结果与正确答案不一致',
        youResult: result,
        trueResult,
        score: 0,
        isRight: false,
        error: 0
      })
    } else {
      // 该题正确的返回结果
      return (ctx.body = {
        truemessage: '正确!',
        trueResult,
        isRight: true,
        score: 10,
        error: 0
      })
    }
  }
})

module.exports = router
