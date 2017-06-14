import {dfvContext} from "./dfvContext";
import * as path from "path";
import * as fs from "fs";
import {dfvLog} from "./dfvLog";
const Router = require("koa-router");


export type onRouterFunc = (url: string,
                            modReq: { new(): any; } | null,
                            ctx: dfvContext,
                            next: (dat: any) => Promise<any>,
                            router?: RouterPara) => Promise<any>;


export interface RouterPara {
    /**
     * 路由目录
     */
    menu: string,
    /**
     * Router回调
     */
    onRouter: onRouterFunc,

    /**
     * 路由额外参数
     */
    extPara?: any,
}

export interface ReqRes {
    request: any;
    response: any;
    params: any;
}

export class dfvRouter {

    koaRouter: any

    constructor(public app: any, public router: RouterPara) {
        if (app.context) {
            this.koaRouter = new Router();
            app.use(this.koaRouter.routes())
        }
        else {
            this.addMethod = this.addExpressMethod;
        }
        if (!this.router.onRouter)
            this.router.onRouter = dfvRouter.onRouterDefault
    }


    static onRouterDefault: onRouterFunc = (url, modReq, ctx, router) => {
        return ctx._dat;
    }

    /**
     * 加载路由文件
     * @param http Express或
     * @param menu 路由文件目录,以及异常捕获函数
     */
    static load(http: any, menu: RouterPara[]) {
        for (let m of menu) {
            var routesPath = m.menu;

            console.log("load Routes :" + routesPath);

            let ExpEx = new dfvRouter(http, m);
            dfvRouter.allRouter.push(ExpEx);

            fs.readdirSync(routesPath).forEach(function (file) {
                if (file.endsWith(".js")) {
                    var routePath = path.join(routesPath, file);
                    try {
                        require(routePath)(ExpEx, m.extPara);
                    } catch (e) {
                        dfvLog.err(e);
                    }
                }
            });
        }

        //加载结束
        dfvRouter.onRouterLoad(null, null, "", null);

    }

    static allRouter = Array<dfvRouter>();

    /**
     * 每个路由加载回调
     * @param url
     * @param modReq
     * @param resp
     * @param method
     */
    static onRouterLoad = function (url: string | null, modReq: { new(): any; } | null, resp: any, method: string | null) {

    }

    /**
     * 添加post接口
     * @param url
     * @param modReq 接口请求参数
     * @param res
     * @param respData 用于生成接口文档,注明返回值类型
     */
    post<T>(url: string,
            modReq: { new(): T; } | null,
            res: (req: dfvContext, data: T) => (any),
            respData?: any) {
        this.addMethod("post", url, modReq, res, respData);
    }

    /**
     * 所有接口请求
     * @param url
     * @param modReq
     * @param res
     * @param respData
     */
    all<T>(url: string,
           modReq: { new(): T; } | null,
           res: (req: dfvContext, data: T) => (any),
           respData?: any) {
        this.addMethod("all", url, modReq, res, respData);
    }

    put<T>(url: string,
           modReq: { new(): T; } | null,
           res: (req: dfvContext, data: T) => (any),
           respData?: any) {
        this.addMethod("put", url, modReq, res, respData);
    }

    delete<T>(url: string,
              modReq: { new(): T; } | null,
              res: (req: dfvContext, data: T) => (any),
              respData?: any) {
        this.addMethod("delete", url, modReq, res, respData);
    }

    get<T>(url: string,
           modReq: { new(): T; } | null,
           res: (req: dfvContext, data: T) => (any),
           respData?: any) {
        this.addMethod("get", url, modReq, res, respData);
    }


    /**
     * 添加koa router
     * @param method
     * @param url
     * @param modReq
     * @param res
     * @param respData
     */
    private addMethod<T>(method: "get" | "post" | "all" | "put" | "delete",
                         url: string,
                         modReq: { new(): T; } | null,
                         res: (req: dfvContext, data: T) => (Promise<any>),
                         respData?: any) {

        dfvRouter.onRouterLoad(url, modReq, respData, method);

        this.koaRouter[method](url, (ctx: dfvContext & ReqRes, next) => {

            ctx.isKoa = true;
            ctx.request.params = ctx.params;

            return this.router.onRouter(url, modReq, ctx, dat => res(ctx, dat), this.router)
                .then(ret => {
                    if (ret !== void 0)
                        ctx.body = ret;
                })
        })
    }

    /**
     * 添加express router
     * @param method
     * @param url
     * @param modReq
     * @param res
     * @param respData
     */
    private addExpressMethod<T>(method: "get" | "post" | "all" | "put" | "delete",
                                url: string,
                                modReq: { new(): T; } | null,
                                res: (req: dfvContext, data: T) => (Promise<any>),
                                respData?: any) {

        dfvRouter.onRouterLoad(url, modReq, respData, method);

        this.app[method](url, (req, resp) => {

            var ctx = {request: req, response: resp, isKoa: false} as any as dfvContext;

            this.router.onRouter(url, modReq, ctx as dfvContext, dat => res(ctx, dat), this.router)
                .then(ret => {
                    if (ret !== void 0)
                        ctx.body = ret;

                    if (typeof ctx.body === "number")
                        ctx.body = ctx.body.toString();

                    if (ctx.status !== void 0)
                        resp.status(ctx.status);

                    if (ctx.body !== void 0)
                        resp.send(ctx.body)
                })
                .catch(err => {
                    dfvLog.err(err);
                    resp.status(500).send("server error!")
                })

        });

    }
}