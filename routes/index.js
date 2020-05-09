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

// 用于返回错误信息
function errorMessFun (ctx, message, studentId, answer, trueAnswer) {

  try{
    // 保存错题记录

  }catch(e){

  }finally{
    return (ctx.body = {
      errormessage: message,
      score: 0,
      isRight: false,
      error: 0
    })
  }
}

// 学生完成题目接口
router.post('/completeTitle', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const studentId = res_token.uniqueIdentifier // 从token中获取学生学号
  const params = ctx.request.body
  const titleId = params.titleId
  let answer = params.answer.trim() // 学生提交答案
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

  const methodsFlag = answer.split(' ')[0]
  let reTurnBody = null;
  let flag = true // 判断该题是否做对了
  let performError = false // 判断是否执行报错
  let title = await titleSql.queryInfoById(titleId) // 查询正确的答案
  let trueAnswer = title[0].answer // 正确答案

  let temStuList = [] // 用于存储学生sql语句的执行结果
  let temTeaList = [] // 用于存储教师sql语句的执行结果

  if (trueAnswer.split(' ')[0] !== methodsFlag) {
    return  errorMessFun(ctx, '答案错误', studentId, answer, trueAnswer)
  }
  if (methodsFlag !== 'select') {
    // 非查询操作

    // 提取学生答案中涉及到的表名
    const arr = answer.split(' ')
    const tem = arr.filter(item => {
      if (item.indexOf('_info') !== -1) {
        return item
      }
    })
    // 提取教师答案中涉及到的表名
    const arrTea = trueAnswer.split(' ')
    const temTea = arrTea.filter(item => {
      if (item.indexOf('_info') !== -1) {
        return item
      }
    })
    // 比对提取到的两个表名
    if (temTea.join(',') !== tem.join(',')) {
      return errorMessFun(ctx, '答案错误', studentId, answer, trueAnswer)
    }
    // 如果没有提取到表名，答案错误
    if (!tem.length) {
      return errorMessFun(ctx, '答案错误', studentId, answer, trueAnswer)
    }

    const hash = Math.random()
      .toString(36)
      .substr(2)
    const hash2 = Math.random()
      .toString(36)
      .substr(2)

    const tableName = tem[0] + hash // 生成执行学生结果的临时随机表
    const tableNameTea = tem[0] + hash2 // 生成执行教师sql临时表

    try {
      await practiceSql.createTemTable(tableName, tem[0]) // 创建学生临时表
      await practiceSql.createTemTable(tableNameTea, tem[0]) // 创建教师临时表

      // 在学生临时表中执行学生sql语句
      // 1、替换sql语句
      answer = answer.replace(/\w+_info/g, () => {
        return tableName
      })
      // 2、在临时表中执行sql语句
      await practiceSql.perform(answer)
      // 3、查询学生临时表中的所有数据
      temStuList = await practiceSql.queryDataTemTable(tableName)
      // 在教师临时表执行正确的sql语句
      // 1、替换sql语句
      trueAnswer = trueAnswer.replace(/\w+_info/g, () => {
        return tableNameTea
      })
      // 2、在临时表中执行sql语句
      await practiceSql.perform(trueAnswer)
      // 3、查询教师临时表中的所有数据
      temTeaList = await practiceSql.queryDataTemTable(tableNameTea)
    } catch (e) {
      // 记录错误的返回体信息，不能直接返回，需要将临时表清楚，并记录错误状态
      performError = true;
      reTurnBody = errorMessFun(ctx, `答案错误,错误信息为：${e.toString()}`, studentId, answer, trueAnswer)
    } finally {
      await practiceSql.deleteTemTable(tableName) // 删除临时表
      await practiceSql.deleteTemTable(tableNameTea) // 删除教师临时表
    }
  } else {
    // 查询操作

    try {
      // 执行学生sql语句
      temStuList = await practiceSql.perform(answer)
      // 执行教师sql语句
      temTeaList = await practiceSql.perform(trueAnswer)
    } catch (e) {
       return errorMessFun(ctx, `答案错误,错误信息为：${e.toString()}`, studentId, answer, trueAnswer)
    }
  }

  if(performError) {
    return reTurnBody;
  }
  // 提交结果和正确结果不相同
  if (JSON.stringify(temStuList) !== JSON.stringify(temTeaList)) {
     flag = false
  }
  // 该题错误的返回结果
  if (!flag) {
    return errorMessFun(ctx, '答案错误!', studentId, answer, trueAnswer)
  } else {
    // 该题正确的返回结果
    return (ctx.body = {
      truemessage: '答案正确!',
      isRight: true,
      score: 10,
      error: 0
    })
  }

})

module.exports = router
