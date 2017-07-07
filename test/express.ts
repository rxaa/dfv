import {dfvLib} from "../src/dfvLib";
dfvLib.init(__dirname);

import * as https from 'https';
import * as http from 'http';
import * as net from "net";
import * as express from 'express';
import {dfvRouter} from "../src/control/dfvRouter";
import {dfv} from "../src/public/dfv";
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
            dat.ctx.body = "网络异常1";
        }
    }
}]);

app.get("/user/test", (req, resp) => {
    resp.send("ok");
});


app.use(express.static(path.join(__dirname, 'public')));

app.use(function responser(req: express.Request, resp: express.Response, next: () => void) {
    resp.status(404);
    resp.end('404, Page Not Found!');
});

//错误处理
function errorHandler(err: Error, req: express.Request, res: express.Response, next: Function): any {
    dfvLog.write(req.url + " " + req.ip + " errorHandler", err);
    res.status(500);
    res.end("server error2");
}
app.use(errorHandler);

http.createServer(app).listen(3002, () => {
    console.log('express server listening on port 3002');
}).on('connection', function (socket: net.Socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(5 * 60 * 1000);
});