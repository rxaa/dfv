import {IMenthodInfo, route} from "./route";
import {IFieldRes, IncomingFormParse, valid} from "../public/valid";
import {ReqRes, RouterPara} from "./dfvRouter";
import {dfvForm} from "../dfvForm";
import {dfvContext} from "../dfvContext";
import {dfvFile} from "../dfvFile";

export interface IOnRouteParas {
    /**
     * 参数验证结果
     */
    valid: IFieldRes<any>;
    /**
     * 参数数据
     */
    dats: Array<any>;
    /**
     * controller类实例
     */
    controller: any;

    ctx: dfvContext;
    /**
     * 路由信息
     */
    router: dfvController;
}

const MSG_INVALID = valid.errMsg_;

export class dfvController {

    /**
     * 最终path
     */
    url: string;

    constructor(/**
                 * controller类型
                 */
                public clas: { new(): any; },
                /**
                 * controller中成员方法名
                 */
                public methodName: string,
                public info: IMenthodInfo, public router: RouterPara) {

        this.url = this.getUrl();
    }

    /**
     * 参数验证函数列表
     * @type {any[]}
     */
    private parasGetFunc = Array<(ctx: dfvContext, valid: IFieldRes<any>) => void>();


    private getUrl() {
        let path = route.getPath(this.clas);
        if (path == null) {
            path = "/" + this.clas.name.toLowerCase().replace("controller", "")
        }
        if (this.info.path) {
            path += this.info.path;
        }
        else {
            path += "/" + this.methodName;
        }

        return path;
    }

    private multipart: (mutl: IncomingFormParse) => void;

    buildParasGetFunc() {
        this.multipart = route.getMultipart(this.clas, this.methodName);
        if (this.multipart) {
            this.onRoute = this.onRouteAsync
        }
        let func = (ctx: dfvContext & ReqRes, valid: IFieldRes<any>) => {

        }

        for (let i = 0; i < this.info.parasType.length; i++) {

            let type = this.info.parasType[i];
            let name = this.info.parasName[i];
            let fromUrl = route.getFromUrl(this.clas, this.methodName, i);
            let fromBody = route.getFromBody(this.clas, this.methodName, i);
            let validFunc = valid.getFieldCheckMetaData(this.clas, this.methodName + i);

            if (type === Object) {
                throw Error(this.clas.name + "." + this.methodName + `() 参数:${name} 需要指定具体类型！`);
            }
            else if (type === String) {
                func = this.buildString(func, name, fromUrl, fromBody, validFunc);
            }
            else if (type === Number) {
                func = this.buildNumber(func, name, fromUrl, fromBody, validFunc);
            }
            else if (type === Boolean) {
                throw Error(this.clas.name + "." + this.methodName + `() 参数:${name} 暂不支持该类型！`);
            }
            else if (type instanceof Function) {
                func = this.buildClass(func, type, name, fromUrl, fromBody, validFunc);
            }
            else {
                throw Error(this.clas.name + "." + this.methodName + `() 参数:${name} 暂不支持该类型！`);
            }
            this.parasGetFunc.push(func);
        }
    }


    private static toFloat(val: any) {
        if (val == null)
            return 0;
        val = parseFloat(val)
        if (isNaN(val))
            return 0;
        return val;
    }


    onRoute(ctx: dfvContext) {
        return this.router.onRoute(this.getRouteParas(ctx))
    }

    onRouteAsync(ctx: dfvContext) {
        //解析文件
        let form = dfvForm.newForm();
        this.multipart(form);


        return dfvForm.parseModPromise(form, ctx).then(() => {
            // let check_data = valid.checkObj(ret, modInst);
            // if (!check_data.ok)
            //     dfvForm.removeFileList(form);
            let paras = this.getRouteParas(ctx);
            if (!paras.valid.ok)
                dfvForm.removeFileList(form);
            return this.router.onRoute(paras)
        });

    }

    private getRouteParas(ctx: dfvContext) {
        var controlInst = new this.clas();
        controlInst.ctx = ctx;
        var paras: IOnRouteParas = {
            valid: {ok: true, msg: "", val: null, defaul: null} as IFieldRes<any>,
            router: this,
            ctx: ctx,
            controller: controlInst,
            dats: [],
        };

        for (var i = 0; i < this.parasGetFunc.length; i++) {
            this.parasGetFunc[i](ctx, paras.valid);
            if (!paras.valid.ok)
                break;
            paras.dats.push(paras.valid.val)
        }

        return paras;
    }

    /**
     * 执行Controller的成员函数
     * @param paras
     */
    next = (paras: IOnRouteParas): any => {
        if (paras.dats.length == 0)
            return paras.controller[this.methodName]();
        if (paras.dats.length == 1)
            return paras.controller[this.methodName](paras.dats[0]);

        return paras.controller[this.methodName].apply(paras.controller, paras.dats);
    }


    private buildClass(func: (ctx: dfvContext & ReqRes, valid: IFieldRes<any>) => void
        , type: { new(): any; }
        , name: string
        , fromUrl: boolean
        , fromBody: boolean
        , validFunc: (o: IFieldRes<any>) => boolean) {

        if (fromBody) {
            if (this.multipart) {
                func = (ctx, val) => {
                    valid.checkObj(ctx.multipart!.fields, new type(), val, void 0, ctx.multipart!.files)
                }
            }
            else {
                func = (ctx, val) => {
                    valid.checkObj(ctx.request.body, new type(), val)
                }
            }
        }
        else if (fromUrl) {
            func = (ctx, val) => {
                valid.checkObj(ctx.request.query, new type(), val)
            }
        }
        else {
            if (this.multipart) {
                func = (ctx, val) => {
                    valid.checkObj(ctx.multipart!.fields, new type(), val, ctx.request.query, ctx.multipart!.files)
                }
            }
            else {
                func = (ctx, val) => {
                    valid.checkObj(ctx.request.body, new type(), val, ctx.request.query)
                }
            }
        }

        return func;
    }


    private buildNumber(func: (ctx: dfvContext & ReqRes, valid: IFieldRes<any>) => void
        , name: string
        , fromUrl: boolean
        , fromBody: boolean
        , validFunc: (o: IFieldRes<any>) => boolean) {

        if (fromBody) {
            if (validFunc) {
                if (this.multipart) {
                    func = (ctx, val) => {
                        val.val = ctx.multipart!.fields[name]
                        val.defaul = 0;
                        val.msg = name + MSG_INVALID;
                        val.ok = validFunc(val);
                    }
                }
                else {
                    func = (ctx, valid) => {
                        valid.val = ctx.request.body[name];
                        valid.defaul = 0;
                        valid.msg = name + MSG_INVALID;
                        valid.ok = validFunc(valid);
                    }
                }
            }
            else if (this.multipart) {
                func = (ctx, valid) => {
                    valid.val = dfvController.toFloat(ctx.multipart!.fields[name]);
                }
            }
            else {
                func = (ctx, valid) => {
                    valid.val = dfvController.toFloat(ctx.request.body[name]);
                }
            }

        }
        else if (fromUrl) {
            if (validFunc) {
                func = (ctx, valid) => {
                    valid.val = ctx.request.query[name];
                    valid.defaul = 0;
                    valid.msg = name + MSG_INVALID;
                    valid.ok = validFunc(valid);
                }
            }
            else {
                func = (ctx, valid) => {
                    valid.val = dfvController.toFloat(ctx.request.query[name]);
                }
            }
        }
        else {
            if (validFunc) {
                if (this.multipart) {
                    func = (ctx, valid) => {
                        valid.msg = name + MSG_INVALID;
                        valid.defaul = 0;
                        valid.val = ctx.multipart!.fields[name];
                        if (valid.val == null)
                            valid.val = ctx.request.query[name];
                        valid.ok = validFunc(valid);
                    }
                }
                else {
                    func = (ctx, valid) => {
                        valid.msg = name + MSG_INVALID;
                        valid.defaul = 0;
                        valid.val = ctx.request.body[name];
                        if (valid.val == null)
                            valid.val = ctx.request.query[name];
                        valid.ok = validFunc(valid);
                    }
                }

            }
            else if (this.multipart) {
                func = (ctx, valid) => {
                    var v = ctx.multipart!.fields[name];
                    if (v == null)
                        v = ctx.request.query[name];
                    valid.val = dfvController.toFloat(v);
                }
            }
            else {
                func = (ctx, valid) => {
                    var v = ctx.request.body[name];
                    if (v == null)
                        v = ctx.request.query[name];
                    valid.val = dfvController.toFloat(v);
                }
            }
        }

        return func;
    }


    private buildString(func: (ctx: dfvContext & ReqRes, valid: IFieldRes<any>) => void
        , name: string
        , fromUrl: boolean
        , fromBody: boolean
        , validFunc: (o: IFieldRes<any>) => boolean) {

        if (fromBody) {
            if (validFunc) {
                if (this.multipart) {
                    func = (ctx, valid) => {
                        valid.msg = name + MSG_INVALID;
                        valid.val = ctx.multipart!.fields[name]
                        valid.defaul = "";
                        valid.ok = validFunc(valid);
                    }
                }
                else {
                    func = (ctx, valid) => {
                        valid.msg = name + MSG_INVALID;
                        valid.val = ctx.request.body[name];
                        valid.defaul = "";
                        valid.ok = validFunc(valid);
                    }
                }
            }
            else if (this.multipart) {
                func = (ctx, valid) => {
                    var v = ctx.multipart!.fields[name];
                    if (v == null)
                        valid.val = ""
                    else
                        valid.val = "" + v;
                }
            }
            else {
                func = (ctx, valid) => {
                    var v = ctx.request.body[name];
                    if (v == null)
                        valid.val = ""
                    else
                        valid.val = "" + v;
                }
            }

        }
        else if (fromUrl) {
            if (validFunc) {
                func = (ctx, valid) => {
                    valid.msg = name + MSG_INVALID;
                    valid.val = ctx.request.query[name];
                    valid.defaul = "";
                    valid.ok = validFunc(valid);
                }
            }
            else {
                func = (ctx, valid) => {
                    var v = ctx.request.query[name];
                    if (v == null)
                        valid.val = ""
                    else
                        valid.val = "" + v;
                }
            }
        }
        else {
            if (validFunc) {
                if (this.multipart) {
                    func = (ctx, valid) => {
                        valid.msg = name + MSG_INVALID;
                        valid.defaul = "";
                        valid.val = ctx.multipart!.fields[name];
                        if (valid.val == null)
                            valid.val = ctx.request.query[name];
                        valid.ok = validFunc(valid);
                    }
                }
                else {
                    func = (ctx, valid) => {
                        valid.msg = name + MSG_INVALID;
                        valid.defaul = "";
                        valid.val = ctx.request.body[name];
                        if (valid.val == null)
                            valid.val = ctx.request.query[name];
                        valid.ok = validFunc(valid);
                    }
                }

            }
            else if (this.multipart) {
                func = (ctx, valid) => {
                    var v = ctx.multipart!.fields[name];
                    if (v == null)
                        v = ctx.request.query[name];
                    if (v == null)
                        valid.val = ""
                    else
                        valid.val = "" + v;
                }
            }
            else {
                func = (ctx, valid) => {
                    var v = ctx.request.body[name];
                    if (v == null)
                        v = ctx.request.query[name];
                    if (v == null)
                        valid.val = ""
                    else
                        valid.val = "" + v;
                }
            }
        }

        return func;
    }
}
