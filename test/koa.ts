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
import {dfvRouter} from "../src/dfvRouter";
import {dfv} from "../public/dfv";
import {dfvContext} from "../src/dfvContext";

/**
 * 中间件集合：
 * https://github.com/koajs/koa/wiki#middleware
 */
const app = new Koa();


app.use(async (ctx: Koa.Context, next: Function) => {
    try {
        await next()
    } catch (err) {
        console.error(err)
        ctx.status = 500;
        ctx.body = "服务器内部错误";
    }
});

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
}))

//加载路由
dfvRouter.load(app, [
    {
        menu: dfv.root + "/router",
        onRouter: async (url, modReq, ctx: dfvContext & Koa.Context, next) => {
            return next(ctx._dat)
        }
    },
    {
        menu: dfv.root + "/router2",
        onRouter: async (url, modReq, ctx: dfvContext & Koa.Context, next) => {
            return next(ctx._dat)
        }
    },
]);


http.createServer(app.callback()).listen(80, () => {
    console.log('koa server listening on port 80');
}).on('connection', function (socket: net.Socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(5 * 60 * 1000);
});