import "reflect-metadata";
import {dfvRouter, RouterPara} from "./dfvRouter";
import {dfv, MapString} from "../public/dfv";
import {IncomingFormParse} from "../public/valid";

export interface IMenthodInfo {
    /**
     *  http 请求方法：get或post等
     */
    method: string;
    /**
     * 自定义路由名
     */
    path: string | undefined;
    /**
     * 参数类型集合
     */
    parasType: Array<any>;
    /**
     * 参数名集合
     */
    parasName: Array<string>;
}

export interface IRouteComment {
    title: string;
    content: string;
    retData: any;
}

export class route {

    /**
     * 加载路由文件
     * @param http Express或koa
     * @param menu 路由文件目录,以及router函数
     */
    static load(http: any, menu: RouterPara[]) {
        return dfvRouter.load(http, menu);
    }


    static getMethodInfo(clas: Function) {
        return dfv.getData(clas, "route", "method") as MapString<IMenthodInfo> | undefined;
    }

    private static addMethodInfo(method: string, name: string | undefined) {
        return (target: Object, propertyKey: string) => {
            let paraType = Reflect.getMetadata(dfv.meta.paraType, target, propertyKey) as Array<any>;

            let met = route.getMethodInfo(target.constructor);
            if (!met) {
                met = {}
                dfv.setData(target.constructor, "route", "method", met);
            }
            let paraNames = dfv.getParasNameMeta(target, propertyKey);
            if (paraNames.length != paraType.length)
                throw Error("Parameter name parser error!");

            met[propertyKey] = {
                method: method,
                path: name,
                parasType: paraType,
                parasName: paraNames,
            };
        }
    }


    static noAuth() {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "route.noAuth", propertyKey, true);
        }
    }

    static getNoAuth(target: { new(): any; }, propertyKey: string) {
        return dfv.getData(target, "route.noAuth", propertyKey) as boolean;
    }

    /**
     * 设置为只接收get请求
     * @param name
     * @returns {(target:any, propertyKey:string)=>undefined}
     */
    static get(name?: string) {
        return route.addMethodInfo("get", name)
    }

    /**
     * 设置为只接收post请求
     * @param name
     * @returns {(target:any, propertyKey:string)=>undefined}
     */
    static post(name?: string) {
        return route.addMethodInfo("post", name)
    }

    static put(name?: string) {
        return route.addMethodInfo("put", name)
    }

    static delete(name?: string) {
        return route.addMethodInfo("delete", name)
    }

    /**
     * 设置为接收get，post，put
     * 等所有请求
     * @param name
     * @returns {(target:any, propertyKey:string)=>undefined}
     */
    static all(name?: string) {
        return route.addMethodInfo("all", name)
    }

    /**
     * 设置为只接收multipart/form-data文件格式
     */
    static multipart(func: (mutl: IncomingFormParse) => void) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "route.multipart", propertyKey, func);
        }
    }

    static getMultipart(target: { new(): any; }, propertyKey: string) {
        return dfv.getData(target, "route.multipart", propertyKey) as (mutl: IncomingFormParse) => void;
    }

    /**
     * 设置接口文档信息
     */
    static comment(title: string, content: string, retData: any) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "route.comment", propertyKey
                , {title, content, retData} as IRouteComment);
        }
    }

    static getComment(target: { new(): any; }, propertyKey: string) {
        return dfv.getData(target, "route.comment", propertyKey) as IRouteComment | undefined;
    }


    /**
     * 设置参数来自url
     * @param target
     * @param propertyKey
     * @param index
     */
    static fromUrl(target: Object, propertyKey: string, index: number) {
        dfv.setData(target.constructor, "route.fromUrl", index + propertyKey, true);
    }

    static getFromUrl(target: { new(): any; }, propertyKey: string, index: number) {
        return dfv.getData(target, "route.fromUrl", index + propertyKey)as boolean;
    }

    /**
     * 设置参数来自body
     * @param target
     * @param propertyKey
     * @param index
     */
    static fromBody(target: Object, propertyKey: string, index: number) {
        dfv.setData(target.constructor, "route.fromBody", index + propertyKey, true);
    }

    static getFromBody(target: { new(): any; }, propertyKey: string, index: number) {
        return dfv.getData(target, "route.fromBody", index + propertyKey) as boolean;
    }


    /**
     * 设置controller类的根path
     * @param path
     * @returns {(target:{new()=>any})=>undefined}
     */
    static path(path: string) {
        return (target: { new (): any; }) => {
            dfv.setData(target, "route.control", "path", path);
        }
    }

    static getPath(target: Function) {
        return dfv.getData(target, "route.control", "path") as string | undefined;
    }


}