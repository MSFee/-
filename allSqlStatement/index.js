const mysql = require('mysql'); 
const async = require('async');
const config = require('../controllers/defaultConfig');

const pool = mysql.createPool({
  host: config.database.HOST,
  user: config.database.USERNAME,
  password: config.database.PASSWORD,
  database: config.database.DATABASE
});
let allServices = {
  query:function (sql,values) {
    return new Promise((resolve ,reject) =>{
      pool.getConnection(function (err,connection) {
          if(err){
            reject(err)
          }else {
            connection.query(sql,values,(err,rows) => {
                if(err){
                  reject(err)
                }else {
                resolve(rows)
              }
              connection.release()
            })
          }
      })
    })
  },
  transaction: function(sqlparamsEntities) {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if(err) {
         reject(err);
        }
        connection.beginTransaction((err) => {
          if(err) {
            reject(err);
          }
          const funcAry = [];
          sqlparamsEntities.forEach((sql_param) => {
            const tem = (cb) => {
              connection.query(sql_param,null, (tErr, row, fields) => {
                if(tErr) {
                  connection.rollback(() => {
                    reject(tErr);
                  });
                }else  {
                  return cb(null, 'ok');
                }
              })
            };
            funcAry.push(tem);
          });
  
          async.series(funcAry, (err, result) => {
            if(err) {
              connection.rollback(err => {
                connection.release();
                reject(err);
              })
            }else {
              connection.commit((err, info) => {
                if(err) {
                    connection.rollback(err => {
                      connection.release();
                      reject(err);
                    })
                }else {
                  connection.release();
                  resolve(info);
                }
              })
            }
          })
        })
      })
    })
  }
};

module.exports = allServices;
