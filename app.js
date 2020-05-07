const Koa = require('koa');
const app = new Koa();
const json = require('koa-json');
const onerror = require('koa-onerror');
const session = require('koa-session');
const bodyparser = require('koa-body');
const logger = require('koa-logger');
const cors = require('koa-cors');


const index = require('./routes/index');

// error handler
onerror(app);
// cors
app.use(cors({
  origin:function (ctx) {
    if(ctx.url === '/string'){
      return "*";
    }
    return '*';
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text'],
  multipart:true,
  formidable:{
    maxFieldsSize:10*1024*1024,
    multipart:true
  }
}));
app.use(json());
app.use(logger());
// 设置session信息
app.key = ['secret'];
const CONFIG = {
    key: 'koa:sess',
    maxAge: 86400000,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: false,
}
app.use(session(CONFIG, app));

// logger
// app.use(async (ctx, next) => {
//   let url = ctx.url;
//   url = url.split('?');
//   let token = ctx.request.header.authorization;
//   if (url[0] !== '/login') {
//     if (token) {
//       let res = getToken(token);
//       if (res && res.exp <= new Date()/1000) {
//         ctx.status = 403;
//         ctx.body = {
//           msg: 'token已过期，请重新登录',
//           code: 0
//         }
//       } else {
//         await next();
//       }
//     } else {
//       ctx.status = 401;
//       ctx.body = {
//         msg: '没有token',
//         code: 0,
//       }
//     }
//   } else {
//     await next();
//   }
// });


// routes
app.use(index.routes(), index.allowedMethods());
// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app;
