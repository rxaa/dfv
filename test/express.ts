import {dfvLib} from "../src/dfvLib";
dfvLib.init(__dirname);

import * as https from 'https';
import * as http from 'http';
import * as net from "net";
import * as express from 'express';
import {dfvRouter} from "../src/control/dfvRouter";
import {dfv} from "../public/dfv";
import {dfvForm} from "../src/dfvForm";
import {dfvLog} from "../src/dfvLog";
import * as bodyParser from 'body-parser';
import * as path from "path";
import {route} from "../src/control/route";


var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));


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

//加载路由
// dfvRouter.load(app, [
//     {
//         menu: path.join(dfv.root, 'router'),
//         onRouter: async (url, modReq, ctx, next) => {
//             try {
//                 if (!modReq)
//                     return await next({});
//
//                 //入参验证
//                 let paras = await dfvForm.check(modReq, ctx);
//                 if (!paras.ok) {
//                     //验证失败
//                     dfvLog.write(url + " : " + JSON.stringify(paras));
//                     ctx.status = 500;
//                     return paras.msg;
//                 }
//
//
//                 return await next(paras.val)
//             } catch (e) {
//                 dfvLog.write(url + " : " + JSON.stringify(ctx._dat), e)
//                 ctx.status = 500;
//                 return "网络异常";
//             }
//         }
//     },
// ]);

app.use(function responser(req: express.Request, resp: express.Response, next: () => void) {
    resp.status(404);
    resp.end('404, Page Not Found!');
});
app.get

http.createServer(app).listen(3002, () => {
    console.log('express server listening on port 3002');
}).on('connection', function (socket: net.Socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(5 * 60 * 1000);
});