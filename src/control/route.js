"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dfvRouter_1 = require("./dfvRouter");
const dfv_1 = require("../../public/dfv");
class route {
    /**
     * 加载路由文件
     * @param http Express或koa
     * @param menu 路由文件目录,以及router函数
     */
    static load(http, menu) {
        return dfvRouter_1.dfvRouter.load(http, menu);
    }
    static getMethodInfo(clas) {
        return dfv_1.dfv.getData(clas, "route", "method");
    }
    static addMethodInfo(method, name) {
        return (target, propertyKey) => {
            let paraType = Reflect.getMetadata(dfv_1.dfv.meta.paraType, target, propertyKey);
            let met = route.getMethodInfo(target.constructor);
            if (!met) {
                met = {};
                dfv_1.dfv.setData(target.constructor, "route", "method", met);
            }
            let paraNames = dfv_1.dfv.getParameterNames(target[propertyKey]);
            if (paraNames.length != paraType.length)
                throw Error("Parameter name parser error!");
            met[propertyKey] = {
                method: method,
                path: name,
                parasType: paraType,
                parasName: paraNames,
            };
        };
    }
    /**
     * 设置为只接收get请求
     * @param name
     * @returns {(target:any, propertyKey:string)=>undefined}
     */
    static get(name) {
        return route.addMethodInfo("get", name);
    }
    /**
     * 设置为只接收post请求
     * @param name
     * @returns {(target:any, propertyKey:string)=>undefined}
     */
    static post(name) {
        return route.addMethodInfo("post", name);
    }
    static put(name) {
        return route.addMethodInfo("put", name);
    }
    static delete(name) {
        return route.addMethodInfo("delete", name);
    }
    /**
     * 设置为接收get，post，put
     * 等所有请求
     * @param name
     * @returns {(target:any, propertyKey:string)=>undefined}
     */
    static all(name) {
        return route.addMethodInfo("all", name);
    }
    /**
     * 设置为只接收multipart/form-data文件格式
     */
    static multipart(func) {
        return (target, propertyKey) => {
            dfv_1.dfv.setData(target.constructor, "route.multipart", propertyKey, func);
        };
    }
    static getMultipart(target, propertyKey) {
        return dfv_1.dfv.getData(target, "route.multipart", "");
    }
    /**
     * 设置参数来自url
     * @param target
     * @param propertyKey
     * @param index
     */
    static fromUrl(target, propertyKey, index) {
        dfv_1.dfv.setData(target.constructor, "route.fromUrl", index + propertyKey, true);
    }
    static getFromUrl(target, propertyKey, index) {
        return dfv_1.dfv.getData(target, "route.fromUrl", index + propertyKey);
    }
    /**
     * 设置参数来自body
     * @param target
     * @param propertyKey
     * @param index
     */
    static fromBody(target, propertyKey, index) {
        dfv_1.dfv.setData(target.constructor, "route.fromBody", index + propertyKey, true);
    }
    static getFromBody(target, propertyKey, index) {
        return dfv_1.dfv.getData(target, "route.fromBody", index + propertyKey);
    }
    /**
     * 设置controller类的根path
     * @param path
     * @returns {(target:{new()=>any})=>undefined}
     */
    static path(path) {
        return (target) => {
            dfv_1.dfv.setData(target, "route.control", "path", path);
        };
    }
    static getPath(target) {
        return dfv_1.dfv.getData(target, "route.control", "path");
    }
}
exports.route = route;
//# sourceMappingURL=route.js.map