import {dfvController, IOnRouteParas} from "./dfvController";
import * as fs from "fs";
import * as path from "path";
import {dfvLog} from "../dfvLog";
import {IMenthodInfo, route} from "./route";
import * as http from "http";
import {dfvContext} from "../dfvContext";

export interface RouterPara {
    /**
     * 路由目录
     */
    menu: string,
    /**
     * Router回调
     */
    onRoute: (ctx: IOnRouteParas) => Promise<void>,

    /**
     * 不将request.params合并到request.query(默认合并)
     */
    notJoinParamsAndQuery?: boolean,
}


export interface ReqRes {
    request: { body: any, query: any, params: any, method: string };
    response: any;
    params: any;
}

export class dfvRouter {

    private koaRouter: any

    constructor(/**
                 *  koa或express实例
                 */
                public app: any,
                /**
                 * 路由参数
                 */
                public router: RouterPara) {
        //通过context属性判断koa
        if (app.context) {
            const Router = require("koa-router");
            this.koaRouter = new Router();
            app.use(this.koaRouter.routes())
        }
        else {
            this.addMethod = this.addExpressMethod;
        }
    }

    static getIncomingMessage(cont: dfvContext): http.IncomingMessage {
        return cont.isKoa ? (cont as any).req : (cont as any).request;
    }

    /**
     * 加载路由文件
     * @param http Express或koa
     * @param menu 路由文件目录,以及router函数
     */
    static load(http: any, menu: RouterPara[]) {
        for (let m of menu) {
            var routesPath = m.menu;

            console.log("load Routes :" + routesPath);

            let router = new dfvRouter(http, m);

            fs.readdirSync(routesPath).forEach((file) => {
                if (file.endsWith(".js")) {
                    var routePath = path.join(routesPath, file);
                    try {
                        let req: any = require(routePath);
                        for (let k in req) {
                            let clas = req[k];
                            let menthdInfo = route.getMethodInfo(clas);
                            if (!menthdInfo)
                                continue;

                            for (let method in menthdInfo) {
                                router.addMethod(clas, method, menthdInfo[method]);
                            }
                        }
                    } catch (e) {
                        dfvLog.err(e);
                    }
                }
            });
        }

        //加载结束
        dfvRouter.onRouterLoad(null);

    }


    /**
     * 每个路由加载回调
     * @param ctx
     */
    static onRouterLoad = function (ctx: dfvController | null) {

    }

    /**
     * 添加koa router
     * @param clas
     * @param method
     * @param info
     */
    private addMethod(clas: { new (): any; }, method: string, info: IMenthodInfo) {
        let control = new dfvController(clas, method, info, this.router);
        dfvRouter.onRouterLoad(control);
        control.buildParasGetFunc();

        this.koaRouter[info.method](control.url, (ctx: dfvContext & ReqRes, next: Function) => {
            ctx.isKoa = true;
            ctx.request.params = ctx.params;
            if (!this.router.notJoinParamsAndQuery)
                dfvRouter.joinObj(ctx.request.query, ctx.params);
            return control.onRoute(ctx);
        })
    }


    /**
     * 添加express router
     * @param clas
     * @param method
     * @param info
     */
    private addExpressMethod(clas: { new (): any; }, method: string, info: IMenthodInfo) {
        let control = new dfvController(clas, method, info, this.router)
        dfvRouter.onRouterLoad(control);
        control.buildParasGetFunc();

        this.app[info.method](control.url, (req: any, resp: any, next: Function) => {
            var ctx = {request: req, response: resp, isKoa: false} as any as dfvContext & ReqRes;
            if (!this.router.notJoinParamsAndQuery)
                dfvRouter.joinObj(ctx.request.query, ctx.request.params);

            control.onRoute(ctx)
                .then(() => {
                    if (typeof ctx.body == "number")
                        ctx.body = ctx.body.toString();

                    if (ctx.status != null)
                        resp.status(ctx.status);

                    if (ctx.body != null)
                        resp.send(ctx.body)
                })
                .catch(err => {
                    next(err, req, resp);
                    // dfvLog.err(err);
                    // resp.status(500).send("server error!")
                });
        })
    }

    private static joinObj(obj1: any, obj2: any) {
        for (var key in obj2) {
            obj1[key] = obj2[key];
        }
    }

}