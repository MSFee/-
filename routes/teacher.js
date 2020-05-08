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
const practiceSql = require('../allSqlStatement/practiceSql');

router.prefix('/teacher');

// 老师查询自己创建的试卷
router.get('/queryMyPaperList', async ctx => {
    let token = ctx.request.header.authorization
    let res_token = getToken(token)
    const workNumber = res_token.uniqueIdentifier // 从token中获取教师工号
    try{
        const list = await paperSql.queryMyPaperList(workNumber);
        list.map(item => {
            
        })
        return ctx.body = {
            list,
            error: 0
        }
    }catch(e){
        return ctx.body = {
            message: e.toString(),
            error: -2
        }
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
      const createTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
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

module.exports = router