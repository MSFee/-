// 跟试卷相关接口
const allServices = require('./index')

let parperSql = {
  // 新增一张试卷
  addPaper: function (parmas) {
    let _sql = `insert into paper_info (paperName,createTime,workNumber, count, issued)
        Values (
            '${parmas.paperName}',
            '${parmas.createTime}',
            ${parmas.workNumber},
            0,
            0
        )
        `
    return allServices.query(_sql)
  },
  // 根据试卷ID查询试卷信息
  queryPaperInfo: function (paperId) {
    let _sql = `select * from paper_info where paperId = ${paperId}`
    return allServices.query(_sql)
  },
  // 查询所有的试卷
  queryAllPaperList: function (queryFiled, page, size, sorting) {
    let _sql = `select paperId, paperName, workNumber, createTime, count from paper_info`;
    _sql += ' where issued = 1';
    if(queryFiled.workNumberStr) {
        _sql += ` and workNumber in ${queryFiled.workNumberStr}`;
    }
    if(sorting.accordHeat) {
        _sql += ' order by count desc';
    }
    if(sorting.accordTime) {
        _sql += ' order by createTime desc';
    }
    _sql += ` limit ${(page - 1) * size} , ${size}`
    return allServices.query(_sql)
  },
  // 统计符合要求试卷的数量
  queryAllPaperListCout: function (queryFiled) {
    let _sql = `select count(*) from paper_info`;
    _sql += ' where issued = 1';
    if(queryFiled.workNumberStr) {
        _sql += ` and workNumber in ${queryFiled.workNumberStr}`;
    }
    return allServices.query(_sql)
  },
  // 老师查询自己所创建的试卷
  queryMyPaperList: function (workNumber) {
    let _sql = `select paperId, paperName from paper_info where workNumber = ${workNumber};`
    return allServices.query(_sql)
  },
  // 教师发布试卷
  publishPaper: function (paperId) {
    let _sql = `update paper_info set issued = 1 where paperId = ${paperId}`
    return allServices.query(_sql)
  },
  // 删除试卷
  deletePaper: function (paperId) {
    let _sql1 = `delete from paper_info where paperId = ${paperId};`
    let _sql2 = `delete from title_info where paperId = ${paperId};`
    return allServices.transaction([_sql1, _sql2])
  }
}
module.exports = parperSql
