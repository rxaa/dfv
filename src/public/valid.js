"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dfv_1 = require("./dfv");
const dfvBind_1 = require("./dfvBind");
var validType;
(function (validType) {
    validType[validType["int"] = 0] = "int";
    validType[validType["number"] = 1] = "number";
    validType[validType["string"] = 2] = "string";
    validType[validType["object"] = 3] = "object";
    validType[validType["file"] = 4] = "file";
})(validType = exports.validType || (exports.validType = {}));
class IFieldRes {
    constructor() {
        /**
         * 错误提示
         */
        this.msg = valid.errMsg_;
        /**
         * 验证成功与否
         */
        this.ok = false;
    }
}
exports.IFieldRes = IFieldRes;
class FileMultiple {
}
exports.FileMultiple = FileMultiple;
class valid {
    constructor(func, type) {
        this.func = func;
        this.type = type;
    }
    /**
     * 设置class的验证字段
     * @param obj
     * @param key
     * @param func
     */
    static setFieldCheckMetaData(obj, key, func) {
        dfv_1.dfv.setData(obj, "fieldCheckMap", key, func);
    }
    static getFieldCheckMetaData(obj, key) {
        return dfv_1.dfv.getData(obj, "fieldCheckMap", key);
    }
    // static isFile(req: any) {
    //     return req instanceof valid;
    // }
    /**
     * @装饰int类型数据验证
     * @param func 验证回调函数
     * @param msg 验证失败提示
     * @returns {function(Object, string): undefined}
     */
    static int(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null) {
                    obj.val = obj.defaul;
                }
                else {
                    obj.val = parseInt(obj.val);
                    if (isNaN(obj.val)) {
                        obj.val = obj.defaul;
                        ret = false;
                    }
                    else
                        ret = true;
                }
                if (msg)
                    obj.msg = msg;
                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 整数+大于0验证
     * @param func
     * @param msg
     * @returns {function(Object, string): undefined}
     */
    static intNotZero(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                var parasName = dfv_1.dfv.getParasNameMeta(target, propertyKey);
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null) {
                    obj.val = obj.defaul;
                }
                else {
                    obj.val = parseInt(obj.val);
                    if (isNaN(obj.val)) {
                        obj.val = obj.defaul;
                        ret = false;
                    }
                    else
                        ret = obj.val > 0;
                }
                if (msg)
                    obj.msg = msg;
                else {
                    if (index !== void 0 && parasName)
                        obj.msg = parasName[index];
                    else
                        obj.msg = propertyKey;
                    obj.msg += " must be greater than 0";
                }
                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 可为null整数
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static intNullAble(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = true;
                if (obj.val == null) {
                    obj.val = null;
                }
                else {
                    obj.val = parseInt(obj.val);
                    if (isNaN(obj.val)) {
                        obj.val = obj.defaul;
                        ret = false;
                    }
                }
                if (msg)
                    obj.msg = msg;
                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 浮点数验证
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static float(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null) {
                    obj.val = obj.defaul;
                }
                else {
                    obj.val = parseFloat(obj.val);
                    if (isNaN(obj.val)) {
                        obj.val = obj.defaul;
                        ret = false;
                    }
                    else
                        ret = true;
                }
                if (msg)
                    obj.msg = msg;
                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 数组验证（默认不遍历数组验证其内容，自行调用扩展函数：r.val.eachTo验证）
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static array(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null) {
                    obj.val = obj.defaul;
                }
                else if (!Array.isArray(obj.val)) {
                    obj.val = obj.defaul;
                }
                if (msg)
                    obj.msg = msg;
                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 文件验证
     * @param func
     * @param msg
     * @returns {exp}
     */
    static file(func, msg) {
        return new valid(file => {
            let ret = true;
            if (msg)
                file.msg = msg;
            if (file.val && !file.val.path) {
                return false;
            }
            if (func) {
                ret = func(file);
            }
            return ret;
        }, validType.file);
    }
    /**
     * 数组文件(form表单的重复name，或者后面加[])
     * @param func
     * @param msg
     * @returns {any}
     */
    static fileArray(func, msg) {
        return new valid(file => {
            let ret = true;
            if (file.val == null) {
                file.val = [];
            }
            else if (!Array.isArray(file.val)) {
                file.val = [];
            }
            if (msg)
                file.msg = msg;
            if (func) {
                ret = func(file);
            }
            return ret;
        }, validType.file);
    }
    static object(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null || typeof obj.val != "object") {
                    obj.val = obj.defaul;
                }
                else {
                    valid.checkObj(obj.val, obj.defaul, obj);
                    if (!obj.ok)
                        return false;
                }
                if (msg)
                    obj.msg = msg;
                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 字符串+非空验证
     * @param func
     * @param msg
     * @returns {function(Object, string): undefined}
     */
    static stringNotEmpty(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                var parasName = dfv_1.dfv.getParasNameMeta(target, propertyKey);
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null) {
                    obj.val = obj.defaul;
                }
                else {
                    obj.val = obj.val + "";
                    ret = obj.val.length > 0;
                }
                if (msg)
                    obj.msg = msg;
                else {
                    if (index !== void 0 && parasName)
                        obj.msg = parasName[index];
                    else
                        obj.msg = propertyKey;
                    obj.msg += " can not be empty";
                }
                if (func instanceof RegExp) {
                    ret = func.test(obj.val);
                }
                else if (func instanceof Function) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    static string(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = false;
                if (obj.val == null) {
                    obj.val = obj.defaul;
                }
                else {
                    obj.val = obj.val + "";
                    ret = true;
                }
                if (msg)
                    obj.msg = msg;
                if (func instanceof RegExp) {
                    ret = func.test(obj.val);
                }
                else if (func instanceof Function) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 可为null的字串类型验证
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static stringNullAble(func, msg) {
        return (target, propertyKey, index) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData(target.constructor, propertyKey, obj => {
                let ret = true;
                if (obj.val == null) {
                    obj.val = null;
                }
                else {
                    obj.val = obj.val + "";
                }
                if (msg)
                    obj.msg = msg;
                if (func instanceof RegExp) {
                    ret = func.test(obj.val);
                }
                else if (func instanceof Function) {
                    ret = func(obj);
                }
                return ret;
            });
        };
    }
    /**
     * 将对象转为可绑定对象
     * @param className 对象类名或对象
     * @returns {any}
     */
    static bindAble(className) {
        if (typeof className === "function") {
            let ret = new className();
            dfvBind_1.BindField.init(ret);
            return ret;
        }
        dfvBind_1.BindField.init(className);
        return className;
    }
    /**
     * 验证数据（后端）
     * @param from 待验证数据
     * @param objRes
     * @returns {IFieldRes<T>}
     */
    static check(from, objRes) {
        return valid.checkObj(from, from, objRes);
    }
    /**
     * 验证并转换数据（后端）
     * @param from 待验证数据
     * @param toObj 经类型转换后的验证结果
     * @param objRes IFieldRes
     * @param from2 待验证数据2(from中未找到，则在2中查找)
     * @param valids 当属性为valid的验证数据源
     * @returns {IFieldRes<T>}
     */
    static checkObj(from, toObj, objRes, from2, valids) {
        if (objRes == null) {
            objRes = new IFieldRes();
        }
        objRes.ok = true;
        for (var key in toObj) {
            objRes.defaul = toObj[key];
            var type = typeof objRes.defaul;
            if (type === "function")
                continue;
            //来自valids的验证
            if (valids && objRes.defaul instanceof valid) {
                objRes.val = valids[key];
                objRes.msg = key + " " + valid.errMsg_;
                objRes.ok = objRes.defaul.func(objRes);
                toObj[key] = objRes.val;
                //验证失败
                if (!objRes.ok) {
                    break;
                }
                continue;
            }
            objRes.val = from[key];
            objRes.msg = key + valid.errMsg_;
            if (from2 && objRes.val === void 0) {
                objRes.val = from2[key];
            }
            //回调函数验证
            var func = valid.getFieldCheckMetaData(toObj.constructor, key);
            if (func) {
                objRes.ok = func(objRes);
                toObj[key] = objRes.val;
                //验证失败
                if (!objRes.ok) {
                    break;
                }
                continue;
            }
            //无回调,判断default类型
            if (objRes.val == null) {
                objRes.val = objRes.defaul;
            }
            else if (type === "number") {
                objRes.val = parseFloat(objRes.val);
                if (isNaN(objRes.val))
                    objRes.val = objRes.defaul;
            }
            else if (type === "string") {
                objRes.val = (objRes.val + "");
            }
            else if (objRes.defaul && type === "object") {
                //验证子对象
                if (typeof objRes.val != "object") {
                    objRes.ok = false;
                    break;
                }
                valid.checkObj(objRes.val, objRes.defaul, objRes);
                //验证失败
                if (!objRes.ok) {
                    break;
                }
            }
            toObj[key] = objRes.val;
        }
        objRes.val = toObj;
        return objRes;
    }
    /**
     * 异步验验证数据(前端)
     * @param from 待验证数据
     * @param objRes
     * @returns {IFieldRes<T>}
     */
    static checkAsync(from, objRes) {
        return valid.checkObjAsync(from, from, objRes);
    }
    /**
     * 异步验证并转换数据(前端)
     * @param from 待验证数据
     * @param toObj 经类型转换后的验证结果
     * @param objRes IFieldRes
     * @returns {IFieldRes<T>}
     */
    static checkObjAsync(from, toObj, objRes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!objRes)
                objRes = new IFieldRes();
            objRes.ok = true;
            var bindList = [];
            for (var key in from) {
                dfvBind_1.BindField.initGetBindList(bl => {
                    objRes.defaul = from[key];
                    bindList = bl;
                });
                var type = typeof objRes.defaul;
                if (type === "function")
                    continue;
                objRes.val = objRes.defaul;
                objRes.msg = key + " " + valid.errMsg_;
                if (bindList.length > 0) {
                    for (let it of bindList) {
                        for (let bind of it.htmlBind) {
                            if (bind.html && bind.editAble && bind.onSet) {
                                try {
                                    bind.isEditOnSet = false;
                                    yield bind.onSet(objRes.val, bind, it);
                                }
                                catch (e) {
                                    objRes.msg = e.message;
                                    objRes.ok = false;
                                    return objRes;
                                }
                            }
                        }
                    }
                }
                if (objRes.defaul && type == "object") {
                    valid.checkObj(objRes.defaul, objRes.defaul, objRes);
                    //验证失败
                    if (!objRes.ok) {
                        return objRes;
                    }
                }
                if (objRes.defaul && objRes.defaul instanceof Array) {
                    for (let arr of objRes.defaul) {
                        if (arr && typeof arr == "object") {
                            valid.checkObj(arr, arr, objRes);
                            //验证失败
                            if (!objRes.ok) {
                                return objRes;
                            }
                        }
                    }
                }
                //回调函数验证
                var func = valid.getFieldCheckMetaData(from.constructor, key);
                if (func) {
                    objRes.ok = func(objRes);
                    //验证失败
                    if (!objRes.ok) {
                        return objRes;
                    }
                }
            }
            return objRes;
        });
    }
}
valid.errMsg_ = " : invalid!";
exports.valid = valid;
//# sourceMappingURL=valid.js.map