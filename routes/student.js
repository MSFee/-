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
    const map = new Map()
    for (let i = 0; i < list.length; i++) {
      const workNumber = list[i].workNumber
      if (map.has(workNumber)) {
        list[i].userName = map.get(workNumber)
      } else {
        const userNameList = await userSql.queryNameByWorkNumber(workNumber)
        const userName = userNameList[0].userName
        list[i].userName = userName
        map.set(workNumber, userName)
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

module.exports = router
