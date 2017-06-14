import {dfvLib} from "../src/dfvLib";
dfvLib.init(__dirname);

import * as https from 'https';
import * as http from 'http';
import * as net from "net";
import * as express from 'express';
import {dfvRouter} from "../src/dfvRouter";
import {dfv} from "../public/dfv";
import {dfvContext} from "../src/dfvContext";


var app = express();

//加载路由
dfvRouter.load(app, [
    {
        menu: dfv.root + "/router",
        onRouter: async (url, modReq, ctx: dfvContext, next) => {
            return next(ctx._dat)
        }
    },
    {
        menu: dfv.root + "/router2",
        onRouter: async (url, modReq, ctx: dfvContext, next) => {
            return next(ctx._dat)
        }
    },
]);

app.use(function responser(req: express.Request, resp: express.Response, next: () => void) {
    resp.status(404);
    resp.end('404, Page Not Found!');
});


http.createServer(app).listen(80, () => {
    console.log('express server listening on port 80');
}).on('connection', function (socket: net.Socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(5 * 60 * 1000);
});