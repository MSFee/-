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
const complatePaperSql = require('../allSqlStatement/complatePaperSql')

router.prefix('/teacher')

// 老师查询自己创建的试卷
router.get('/queryMyPaperList', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const workNumber = res_token.uniqueIdentifier // 从token中获取教师工号s
  try {
    const list = await paperSql.queryMyPaperList(workNumber)
    list.map(item => {})
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

// 教师创建试卷接口
router.post('/createPaper', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const workNumber = res_token.uniqueIdentifier // 从token中获取教师工号
  const params = ctx.request.body
  if (!params.paperName) {
    return (ctx.body = {
      message: '试卷名称不能为空',
      error: -1
    })
  }
  try {
    // 获取试卷创建时间
    const createTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    params.createTime = createTime
    params.workNumber = workNumber
    await paperSql.addPaper(params)
    return (ctx.body = {
      message: '试卷创建成功',
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})
// 教师创建题目
router.post('/createTitle', async ctx => {
  const parmas = ctx.request.body
  if (!parmas.paperId) {
    return (ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    })
  }
  if (!parmas.titleName) {
    return (ctx.body = {
      message: '题目名称不能为空',
      error: -1
    })
  }
  if (!parmas.answer) {
    return (ctx.body = {
      message: '答案不能为空',
      error: -1
    })
  }
  if(!((await testAnswer(ctx, parmas.answer)).normalOperation)) {
    return ctx.body = {
      message: '您的答案无法正确执行',
      error: -1
    }
  }
  if (!parmas.score) {
    return (ctx.body = {
      message: '分数不能为空',
      error: -1
    })
  }
  if (typeof Number(parmas.score) !== 'number') {
    return (ctx.body = {
      message: '分数不合法',
      error: -1
    })
  }
  if (Number(parmas.score) >= 100 || Number(parmas.score) <= 0) {
    return (ctx.body = {
      message: '分数大小不合法',
      error: -1
    })
  }
  try {
    const isPaperId = await paperSql.queryPaperInfo(parmas.paperId)
    if (!isPaperId.length) {
      return (ctx.body = {
        message: '无效的试卷ID',
        error: -1
      })
    }
    // 获取题目创建时间
    const createTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    parmas.createTime = createTime
    parmas.answer = parmas.answer.replace(/\'/g, '"')
    await titleSql.addtitle(parmas)
    return (ctx.body = {
      message: '题目创建成功',
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 教师发布试卷/或者撤销发布
router.put('/publishPaper', async ctx => {
  const paperId = ctx.request.body.paperId
  const issued = ctx.request.body.issued
  if (!paperId) {
    return (ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    })
  }
  if (issued !== 1 && issued !== 0) {
    return (ctx.body = {
      message: '无效的发布状态',
      error: -1
    })
  }
  try {
    await paperSql.publishPaper(paperId, issued)
    return (ctx.body = {
      message: issued ? '试卷发布成功' : '试卷撤销发布成功',
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 判断一张试卷是否可以发布
router.get('/queryPaperCanPublic', async ctx => {
  const paperId = ctx.query.paperId
  if (!paperId) {
    return (ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    })
  }
  try {
    const titleList = await titleSql.queryAllTitleByPaperId(paperId)
    if (!titleList.length) {
      return (ctx.body = {
        canPublic: false,
        error: 0
      })
    } else {
      return (ctx.body = {
        canPublic: true,
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

// 判断某一张试卷是否可以撤销发布
router.get('/queryPaperHaveCompalte', async ctx => {
  const paperId = ctx.query.paperId
  try {
    // 判断是否可以撤销发布
    const list = await complatePaperSql.queryPaperHaveCompalte(paperId)
    if (list.length) {
      return (ctx.body = {
        message: '该试卷已有学生完成，无法撤销发布',
        hasComplate: true,
        error: 0
      })
    } else {
      return (ctx.body = {
        message: '可以撤销发布',
        hasComplate: false,
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

// 教师删除试卷
router.delete('/deletePaper', async ctx => {
  const paperId = ctx.query.paperId
  if (!paperId) {
    return (ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    })
  }
  try {
    await paperSql.deletePaper(paperId)
    return (ctx.body = {
      message: '删除试卷成功',
      error: -0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 教师查看试卷下的题目信息以及试卷信息
router.get('/checkInformation', async ctx => {
  const paperId = ctx.query.paperId
  if (!paperId) {
    return (ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    })
  }
  try {
    const paperInfoList = await paperSql.queryPaperInfo(paperId)
    if (!paperInfoList.length) {
      return (ctx.body = {
        message: '无效的试卷ID',
        error: -1
      })
    }
    const paperInfo = paperInfoList[0]
    paperInfo.createTime = moment(paperInfo.createTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )
    const maxScoreList = await complatePaperSql.queryMaxScore(paperId)
    if (maxScoreList.length) {
      paperInfo.maxScore = maxScoreList[0].maxScore
    }
    const titleList = await titleSql.queryAllTitleByPaperId(paperId)
    titleList.map(item => {
      item.createTime = moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
    })
    return (ctx.body = {
      paperInfo,
      titleList,
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 教师删除某一个题目
router.delete('/deleteTitle', async ctx => {
  const titleId = ctx.query.titleId
  if (!titleId) {
    return (ctx.body = {
      message: '题目ID不能为空',
      error: -1
    })
  }
  try {
    await titleSql.deleteTitle(titleId)
    return (ctx.body = {
      message: '题目删除成功',
      error: -0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -2
    })
  }
})

// 教师修改题目
router.post('/changeTitleInfo', async ctx => {
  const params = ctx.request.body
  if (!params.titleName) {
    return (ctx.body = {
      message: '题目名称不能为空',
      error: -1
    })
  }
  if (!params.titleId) {
    return (ctx.body = {
      message: '题目ID不能为空',
      error: -1
    })
  }
  if (!params.answer) {
    return (ctx.body = {
      message: '题目答案不能为空',
      error: -1
    })
  }
  if(!((await testAnswer(ctx, params.answer)).normalOperation)) {
    return ctx.body = {
      message: '您的答案无法正确执行',
      error: -1
    }
  }
  try {
    params.answer = params.answer.replace(/\'/g, '"')
    await titleSql.changeTitleInfo(params)
    return (ctx.body = {
      message: '题目修改成功',
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: 0
    })
  }
})


async function testAnswer(ctx, answer) {
  try {
    let arr = answer.split(' ')
    const sqlOptions = ['insert', 'update', 'delete', 'select'] // 只允许有这四种操作
    if (sqlOptions.indexOf(arr[0]) === -1) {
      return (ctx.body = {
        message: '非法的sql语句, sql只能是插入、更新、删除、查找',
        normalOperation: false,
        error: -1
      })
    }
    let resultList = []
    if (arr[0] === 'select') {
      // 表示查找操作时
      resultList = await practiceSql.perform(answer)
    } else {
      // 其他操作时
      const tem = arr.filter(item => {
        if (item.indexOf('_info') !== -1) {
          return item
        }
      })
      // 如果没有提取到表名
      if (!tem.length) {
        return (ctx.body = {
          message: '非法的sql语句，sql中没有包含正确的表名',
          normalOperation: false,
          error: -1
        })
      }
      const hash = Math.random()
        .toString(36)
        .substr(2)
      const tableName = tem[0] + hash
      await practiceSql.createTemTable(tableName, tem[0]) // 创建临时表
      // 替换sql语句
      let temAnswer = answer.replace(/\w+_info/g, () => {
        return tableName
      })
      // 2、在临时表中执行sql语句
      await practiceSql.perform(temAnswer)
      // 3、查询临时表中的所有数据
      resultList = await practiceSql.queryDataTemTable(tableName)
    }
    return ctx.body = {
      message: 'sql正确执行',
      resultList,
      normalOperation: true,
      error: 0
    }
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      normalOperation: false,
      error: -1
    })
  }
}


// 教师测试答案是否可以正常运行
router.post('/testAnswer', async ctx => {
  const answer = ctx.request.body.answer.trim()
  if (!answer) {
    return (ctx.body = {
      message: '答案不能为空',
      normalOperation: false,
      error: -1
    })
  }
  return testAnswer(ctx, answer);
})
module.exports = router
