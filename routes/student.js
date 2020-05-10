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
router.prefix('/student')

// 学生查看所有的试卷
router.get('/getPaperList', async ctx => {
  const params = ctx.query
  const page = params.page || 1
  const size = params.size || 5
  const sorting = {}
  sorting.accordHeat = params.accordHeat // 按热度排序
  sorting.accordTime = params.accordTime // 按时间排序
  const queryFiled = {}
  try {
    let workNumberList1 = []
    let workNumberList2 = []
    let retArr = [];
    let flagSchool = false
    let flagUserName = false
    let flagQuery = false // 表示是否有查询条件
    if (params.school) {
      workNumberList1 = await userSql.queryWorkNumberBySchool(params.school)
      flagSchool = true
    }
    if (params.userName) {
      workNumberList2 = await userSql.queryWorkNumberByName(params.userName)
      flagUserName = true
    }
    // 只有学校没有教师姓名
    if (flagSchool && !flagUserName) {
        flagQuery = true
       workNumberList1.map(item => {
           retArr.push(item.workNumber);
       })
    }
    // 只有教师姓名没有学校
    if (!flagSchool && flagUserName) {
        flagQuery = true
        workNumberList2.map(item => {
            retArr.push(item.workNumber);
        })
    }
    // 既有学校又有教师姓名
    if (flagSchool && flagUserName) {
        flagQuery = true
        let arr1 = []
        let arr2 = []
        workNumberList1.map(item => {
            arr1.push(item.workNumber)
        })
        workNumberList2.map(item => {
            arr2.push(item.workNumber)
        })
        arr1.map(item => {
            if(arr2.indexOf(item) !== -1) {
                retArr.push(item);
            }
        })
    }
    if(flagQuery && !retArr.length) {
        return ctx.body = {
            list: [],
            page,
            size,
            total: 0,
            totalPage: 0,
            error: 0
        }
    }
    if(retArr.length) {
        let workNumberStr = null;
        workNumberStr = `(${retArr.join(',')})`;
        queryFiled.workNumberStr = workNumberStr;
    }
    const list = await paperSql.queryAllPaperList(
      queryFiled,
      page,
      size,
      sorting
    )
    const userNameMap = new Map()
    const schoolMap = new Map();
    for (let i = 0; i < list.length; i++) {
      const workNumber = list[i].workNumber
      if (userNameMap.has(workNumber)) {
        list[i].userName = userNameMap.get(workNumber)
        list[i].school = schoolMap.get(workNumber);
      } else {
        const userNameList = await userSql.queryNameByWorkNumber(workNumber)
        const userName = userNameList[0].userName
        const school = userNameList[0].school
        list[i].userName = userName
        list[i].school = school
        userNameMap.set(workNumber, userName)
        schoolMap.set(workNumber, school);
      }
      list[i].createTime = moment(list[i].createTime).format(
        'YYYY-MM-DD HH:mm:ss'
      )
      delete list[i].workNumber
    }
    const countList = await paperSql.queryAllPaperListCout(queryFiled)
    const total = countList[0]['count(*)']
    return (ctx.body = {
      list,
      page,
      size,
      total,
      totalPage: Math.ceil(total / Number(size)),
      error: 0
    })
  } catch (e) {
    return (ctx.body = {
      message: e.toString(),
      error: -1
    })
  }
})

// 保存学生的做题记录
async function keepRecord (paperId, titleId, studentId, answer, trueAnswer, isRight) {
  answer = answer.replace(/\'/g, '"')
  trueAnswer = trueAnswer.replace(/\'/g, '"')
  const complateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  try {
    // 根据学生ID和题目ID查询学生是否做过该题，如果做过则修改错题记录，如果没有则新增错题记录
    const errorList = await complateTitleSql.queryScordByID(titleId, studentId)
    if (errorList.length) {
      // 已经存在错题了
      const params = {
        studentId,
        titleId,
        isRight,
        complateTime,
        answer,
      }
      await complateTitleSql.changeTitleRecord(params)
    } else {
      // 不存在错题,新增错题
      // 保存错题记录
      const params = {
        studentId,
        titleId,
        complateTime,
        isRight,
        answer,
        trueAnswer,
        paperId

      }
      await complateTitleSql.addRecord(params)
    }
  } catch (e) {
  }
}

// 用于返回错误信息
function errorMessFun (paperId, ctx, message, titleId, studentId, answer, trueAnswer) {
  keepRecord(paperId, titleId, studentId, answer, trueAnswer, 0)
  return (ctx.body = {
    errormessage: message,
    isRight: false,
    error: 0
  })
}

// 学生完成题目接口
router.post('/completeTitle', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const studentId = res_token.uniqueIdentifier // 从token中获取学生学号
  const params = ctx.request.body
  const titleId = Number(params.titleId)
  const paperId = Number(params.paperId)
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
  if(!paperId) {
    return ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    }
  }
  const methodsFlag = answer.split(' ')[0]
  let reTurnBody = null
  let flag = true // 判断该题是否做对了
  let performError = false // 判断是否执行报错
  let title = await titleSql.queryInfoById(titleId) // 查询正确的答案
  let trueAnswer = title[0].answer // 正确答案

  let temStuList = [] // 用于存储学生sql语句的执行结果
  let temTeaList = [] // 用于存储教师sql语句的执行结果

  if (trueAnswer.split(' ')[0] !== methodsFlag) {
    return errorMessFun(paperId, ctx, '答案错误,错误信息为：sql语句错误', titleId, studentId, answer, trueAnswer)
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
      return errorMessFun(
        paperId, 
        ctx,
        '答案错误, 错误信息为：sql语句错误',
        titleId,
        studentId,
        answer,
        trueAnswer
      )
    }
    // 如果没有提取到表名，答案错误
    if (!tem.length) {
      return errorMessFun(
        paperId, 
        ctx,
        '答案错误,错误信息为：sql语句错误',
        titleId,
        studentId,
        answer,
        trueAnswer
      )
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
      let temAnswer = answer.replace(/\w+_info/g, () => {
        return tableName
      })
      // 2、在临时表中执行sql语句
      await practiceSql.perform(temAnswer)
      // 3、查询学生临时表中的所有数据
      temStuList = await practiceSql.queryDataTemTable(tableName)
      // 在教师临时表执行正确的sql语句
      // 1、替换sql语句
      let temTrueAnswer = trueAnswer.replace(/\w+_info/g, () => {
        return tableNameTea
      })
      // 2、在临时表中执行sql语句
      await practiceSql.perform(temTrueAnswer)
      // 3、查询教师临时表中的所有数据
      temTeaList = await practiceSql.queryDataTemTable(tableNameTea)
    } catch (e) {
      // 记录错误的返回体信息，不能直接返回，需要将临时表清楚，并记录错误状态
      performError = true
      reTurnBody = errorMessFun(
        paperId, 
        ctx,
        `答案错误,错误信息为：${e.toString()}`,
        titleId,
        studentId,
        answer,
        trueAnswer
      )
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
      return errorMessFun(
        paperId, 
        ctx,
        `答案错误,错误信息为：${e.toString()}`,
        titleId,
        studentId,
        answer,
        trueAnswer
      )
    }
  }

  if (performError) {
    return reTurnBody
  }
  // 提交结果和正确结果不相同
  if (JSON.stringify(temStuList) !== JSON.stringify(temTeaList)) {
    flag = false
  }
  // 该题错误的返回结果
  if (!flag) {
    return errorMessFun(
      paperId, 
      ctx,
      '答案错误,错误信息为：结果不一致',
      titleId,
      studentId,
      answer,
      trueAnswer
    )
  } else {
    // 保存正确的做题记录
    keepRecord(paperId, titleId, studentId, answer, trueAnswer, 1)
    // 该题正确的返回结果
    return (ctx.body = {
      truemessage: '答案正确!',
      isRight: true,
      error: 0
    })
  }
})

// 学生获取试卷信息
router.get('/getPaperInfo', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const studentId = res_token.uniqueIdentifier // 从token中获取学生学号
  const paperId = ctx.query.paperId;
  if(!paperId) {
    return ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    }
  }
  try{
      const list = await paperSql.queryPaperDetailInfo(paperId)
      if(!list.length) {
        return ctx.body = {
          message: '不存在该试卷',
          error: -1
        }
      }
      const objInfo = list[0];
      objInfo.createTime = moment(objInfo.createTime).format('YYYY-MM-DD HH:mm:ss')
      const titleTotalList = await titleSql.queryTitalTotal(paperId)
      const titleTotal = titleTotalList[0]['count(*)']
      objInfo.titleTotal = titleTotal;
      const titleList = await titleSql.queryAllTitleByPaperId(paperId);
      objInfo.firstTitleId = titleList[0].titleId;
      return ctx.body = {
        info: objInfo,
        error: 0
      }
  }catch(e){
    return ctx.body = {
      message: e.toString(),
      error: -2
    }
  }
})

// 学生能否交卷接口
router.post('/completePaper', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const studentId = res_token.uniqueIdentifier // 从token中获取学生学号
  const paperId = ctx.request.body.paperId;
  if(!paperId) {
    return ctx.body = {
      message: '试卷ID不能为空',
      error: -1
    }
  }
  try{
    const complateTitleList = await complateTitleSql.getTitleListByPaperId(studentId, paperId)
    const titleList = await titleSql.queryAllTitleByPaperId(paperId)
    let arr = [];
    let arr2 = [];
    complateTitleList.map(item => {
      arr.push(item.titleId)
    })
    titleList.map(item => {
      arr2.push(item.titleId)
    })
    arr.sort((a, b) => a - b);
    arr2.sort((a, b) => a - b);
    let str1 = arr.join(',');
    let str2 = arr2.join(','); // sd
    if(str1 === str2) {
      return ctx.body = {
        message: '您已完成试卷所有题目',
        canSubmit: true,
        error: 0
      }
    }else {
      return ctx.body = {
        message: '您还有题目尚未完成，无法交卷',
        canSubmit: false,
        error: 0
      }
    }
  }catch(e) {
    return ctx.body = {
      message: e.toString(),
      error: -2
    }
  }
})

// 学生获取试卷下所有的题目ID信息
router.get('/getAllTitleID', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const studentId = res_token.uniqueIdentifier // 从token中获取学生学号
  const paperId = ctx.query.paperId;
   if(!paperId) {
     return ctx.body ={
       message: '试卷ID不能为空',
       error: -1
     }
   }
   try{
     const list = await titleSql.queryAllTitleByPaperId(paperId) // 长数组
     const list2 = await complateTitleSql.getTitleListByPaperId(studentId, paperId) // 短数组
     let arr = [];
     const arr2 = [];
     list.map(item => {
       arr.push(item.titleId);
     })
     list2.map(item => {
       arr2.push(item.titleId);
     })
     for(let i = 0; i < arr2.length; i++) {
       const index = arr.indexOf(arr2[i]);
       list[index].isComplate = 1;
     }
     arr = []
     let index = 1;
     list.map(item => {
       arr.push({
         titleId: item.titleId,
         isComplate: item.isComplate ? 1 : 0,
         index,
       })
       index ++
     })
     return ctx.body = {
       titleList: arr,
       error: 0
     }
   }catch(e){
     return ctx.body = {
       message: e.toString(),
       error: -2
     }
   }
})

// 学生获取某一个题目信息
router.get('/getTitleInfo', async ctx => {
  const titleId = ctx.query.titleId
  try{
    const list = await titleSql.queryInfoDetailById(titleId);
    const obj = list[0];
    const paperNameList = await paperSql.queryPaperDetailInfo(obj.paperId);
    obj.paperName = paperNameList[0].paperName;
    delete obj.paperId
    return ctx.body = {
      info: obj,
      error: 0
    }
  }catch(e){
    return ctx.body = {
      message: e.toString(),
      error: -2
    }
  }
})
// 学生查询某一个题是否已经完成
router.get('/getTitleStatus', async ctx => {
  let token = ctx.request.header.authorization
  let res_token = getToken(token)
  const studentId = res_token.uniqueIdentifier // 从token中获取学生学号
  const titleId = ctx.query.titleId;
  if(!titleId) {
    return ctx.body = {
      message: '题目ID不能为空',
      error: -1
    }
  }
  try{
    const list = await complateTitleSql.getTitleStatus(studentId, titleId);
    if(list.length) {
      return ctx.body = {
        isRight: list[0].isRight,
        submitAnswer: list[0].submitAnswer,
        isComplate: 1,
        error: 0
      }
    }else {
      return ctx.body = {
        isComplate: 0,
        error: 0
      }
    }
  }catch(e) {
    return ctx.body = {
      message: e.toString(),
      error: -2
    }
  }
})
// 学生提交试卷接口
router.post('/submitPaper', async ctx => {
  
})
module.exports = router
