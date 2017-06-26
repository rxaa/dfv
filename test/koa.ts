import {dfvLib} from "../src/dfvLib";
dfvLib.init(__dirname);

import * as https from 'https';
import * as http from 'http';
import * as Koa from "koa";
import * as net from "net";
import bodyParser = require("koa-bodyparser");
import compress = require('koa-compress')
const helmet = require('koa-helmet')
import logger = require('koa-logger')
import {dfv} from "../src/public/dfv";
import {dfvLog} from "../src/dfvLog";
import {route} from "../src/control/route";
import * as path from "path";

/**
 * 中间件集合：
 * https://github.com/koajs/koa/wiki#middleware
 */
const app = new Koa();

app.use((ctx: Koa.Context, next: Function) => next().catch((err: Error) => {
    ctx.params
    ctx.request.query
    ctx.request.body
    console.error(err)
    ctx.status = 500;
    ctx.body = "服务器内部错误";
}));
// app.use(async (ctx: Koa.Context, next: Function) => {
//     try {
//         await next()
//     } catch (err) {
//         ctx.params
//         ctx.request.query
//         ctx.request.body
//         console.error(err)
//         ctx.status = 500;
//         ctx.body = "服务器内部错误";
//     }
// });

app.use(logger())

//provides important security headers to make your app more secure
// app.use(helmet())


app.use(bodyParser())

//压缩
app.use(compress({
    // filter: function (content_type) {
    //     return /text/i.test(content_type)
    // },
    threshold: 1024,
    flush: require('zlib').Z_SYNC_FLUSH
}));


route.load(app, [{
    menu: path.join(dfv.root, 'controllers'),
    onRoute: async (dat) => {
        try {
            if (!dat.valid.ok) {
                //验证失败
                dfvLog.write(dat.router.url + " : " + JSON.stringify(dat.valid));
                dat.ctx.status = 500;
                dat.ctx.body = dat.valid.msg;
                return;
            }

            let ret = await dat.router.next(dat);
            if (ret != null)
                dat.ctx.body = ret;
        } catch (e) {
            dfvLog.write(dat.router.url + " : " + JSON.stringify(dat.valid), e)
            dat.ctx.status = 500;
            dat.ctx.body = "网络异常";
        }
    }
}]);

http.createServer(app.callback()).listen(3001, () => {
    console.log('koa server listening on port 3001');
}).on('connection', function (socket: net.Socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(5 * 60 * 1000);
});