// 跟用户操作有关的sql语句
const allServices = require('./index')

let userSql = {
  // 向学生数据中添加一名学生
  addStudent: function (params) {
    let _sql = `insert into student_info  
        (studentId, userName, password, email, school, class, professional) Values (
            '${params.studentId}',
            '${params.userName}',
            '${params.password}',
            '${params.email}',
            '${params.school}',
            '${params.class}',
            '${params.professional}'
        )
        `;
        console.log(_sql)
    return allServices.query(_sql)
  },
  // 向教师数据中添加一名教师
  addTeacher: function (params) {
    let _sql = `insert into teacher_info  
            (workNumber, userName, school, email, password) Values (
                ${params.workNumber},
                '${params.userName}',
                '${params.school}',
                '${params.email}',
                '${params.password}'
            )
            `
    return allServices.query(_sql)
  },
  // 根据学号查询学生密码
  queryPasswordByStudentId: function(studentId) {
    let _sql = `select password, email from student_info where studentId = '${studentId}'`;
    return allServices.query(_sql);
  },
  // 根据学号查询学生名称和学校以及专业
  queryStudentInfo: function(studentId) {
    let _sql = `select userName, school, professional from student_info where studentId = ${studentId}`
    return allServices.query(_sql)
  },
  // 查询邮箱是否唯一
  queryEmail: function(email, status) {
    let fromName = '';
    if(status == 0) {
        fromName = "student_info";
    }else {
        fromName = "teacher_info";
    }
    let _sql = `select email from ${fromName} where email = '${email}'`;
    return allServices.query(_sql);
  },
    // 根据工号查询教师密码
  queryPasswordByWorkNumber: function(workNumber) {
    let _sql = `select password, email from teacher_info where workNumber = ${workNumber}`;
    return allServices.query(_sql);
 },
 // 根据工号查询教师名称
 queryNameByWorkNumber: function(workNumber) {
   let _sql = `select userName, school from teacher_info where workNumber = ${workNumber}`;
   return allServices.query(_sql);
 },
  // 通过学校查询教师工号
  queryWorkNumberBySchool: function(school) {
    let _sql = `select workNumber from teacher_info where school = '${school}'`;
    return allServices.query(_sql);
  },
  // 通过名称查询教师工号
  queryWorkNumberByName: function(userName) {
    let _sql = `select workNumber from teacher_info where userName = '${userName}'`;
    return allServices.query(_sql);
  },
  // 学生修改密码
  changeStudentPassword:function(studentId, password) {
    let _sql = `update student_info set password = '${password}' where studentId = ${studentId}`
    return allServices.query(_sql)
  } ,
  // 教师修改密码
  changeWorkNumberPassword:function(workNumber, password) {
    let _sql = `update teacher_info set password = '${password}' where workNumber = ${workNumber}`
    return allServices.query(_sql)
  } ,
}
module.exports = userSql
