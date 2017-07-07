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
const dfvFront_1 = require("./dfvFront");
const valid_1 = require("./valid");
/**
 * 绑定字段的类型
 */
var BindFieldType;
(function (BindFieldType) {
    BindFieldType[BindFieldType["string"] = 0] = "string";
    BindFieldType[BindFieldType["number"] = 1] = "number";
    BindFieldType[BindFieldType["boolean"] = 2] = "boolean";
    BindFieldType[BindFieldType["array"] = 3] = "array";
    BindFieldType[BindFieldType["object"] = 4] = "object";
})(BindFieldType = exports.BindFieldType || (exports.BindFieldType = {}));
/**
 * 绑定一个表达式
 * @param func 表达式
 * @param ext 额外参数
 * @returns {dfvBindDom}
 */
function dfvBind(func, ext = {}) {
    let bind = new dfvBindDom(func);
    bind.onSet = (val, bind, field) => __awaiter(this, void 0, void 0, function* () {
        try {
            bind.onError(null, val, bind, field);
            if (field.fieldName && field.parent) {
                //回调函数验证
                var func = valid_1.valid.getFieldCheckMetaData(field.parent.constructor, field.fieldName);
                if (func) {
                    let objRes = new valid_1.IFieldRes();
                    objRes.val = val;
                    objRes.ok = func(objRes);
                    if (!objRes.ok)
                        throw dfv_1.dfv.err(objRes.msg);
                    val = objRes.val;
                }
            }
            if (ext.onSet)
                return yield ext.onSet(val, bind, field);
            else
                return val;
        }
        catch (e) {
            bind.onError(e, val, bind, field);
            throw e;
        }
    });
    if (ext.cancelDoubleBind)
        bind.cancelDoubleBind = ext.cancelDoubleBind;
    if (ext.onError)
        bind.onError = ext.onError;
    return bind;
}
exports.dfvBind = dfvBind;
/**
 * 每个dfvBindDom对应一个绑定的html dom元素
 */
class dfvBindDom {
    constructor(/**
                     * 绑定的函数
                     */ bindFunc) {
        this.bindFunc = bindFunc;
        /**
         * 是否可编辑,用于valid.check时判断
         */
        this.editAble = false;
        /**
         * 绑定的属性名
         */
        this.protoName = "";
        /**
         * 是否由编辑html元素触发的onset事件
         */
        this.isEditOnSet = false;
        /**
         * 错误显示函数
         */
        this.onError = (err, val, bind, field) => {
        };
    }
    /**
     *  查找下一个或下下个span
     * @param e
     * @returns {HTMLSpanElement}
     */
    static findNextSpan(e) {
        let span = e ? (e.nextElementSibling || e.nextSibling) : null;
        if (span && span.localName != "span") {
            span = (span.nextElementSibling || span.nextSibling);
            if (span && span.localName != "span") {
                span = null;
            }
        }
        return span;
    }
    /**
     * 将错误信息显示到旁边的span里
     * @param err
     * @param val
     * @param bind
     * @param field
     */
    static showErrorToNextSpan(err, val, bind, field) {
        let span = dfvBindDom.findNextSpan(bind.html);
        if (span) {
            if (err) {
                span.innerHTML = err.message;
                if (bind.html && bind.html.select)
                    bind.html.select();
            }
            else
                span.innerHTML = "";
        }
    }
}
exports.dfvBindDom = dfvBindDom;
/**
 * 每一个对象的属性对应一个BindField,一个属性可以绑定多个BindFunc也就是dom元素
 */
class BindField {
    constructor(/**
                     * 绑定属性的值
                     */ val, 
        /**
         * 属性类型
         */
        type, 
        /**
         * 属性名
         */
        fieldName, 
        /**
         * 属性所属对象
         */
        parent) {
        this.val = val;
        this.type = type;
        this.fieldName = fieldName;
        this.parent = parent;
        this.uniqueId = ++BindField.autoId;
        /**
         * 绑定的dom元素列表
         */
        this.htmlBind = Array();
        /**
         * 属性监听函数列表
         */
        this.watcherLists = [];
    }
    /**
     * 初始化bind字段获取
     * @param func
     */
    static initGetBindList(func) {
        let getBindListOld = BindField.getBindList;
        let bindListMapOld = BindField.bindListMap;
        BindField.getBindList = [];
        BindField.bindListMap = {};
        try {
            func(BindField.getBindList);
        }
        catch (e) {
            dfvFront_1.dfvFront.onCatchError(e);
        }
        finally {
            BindField.getBindList = getBindListOld;
            BindField.bindListMap = bindListMapOld;
        }
    }
    addWatcherFunc(func) {
        this.watcherLists.push(func);
    }
    /**
     * 收集以删除的元素监听
     * @type {Array}
     */
    // private removeList:number[] = [];
    /**
     *添加元素属性的监听函数
     * @param elem
     * @param key
     * @param bindFun
     */
    addWatcherElem(elem, key, bindFun) {
        this.addWatcherFunc((v, e, ind) => {
            //oninput自己触发的事件
            if (e === elem)
                return;
            //
            // if (ind === 0) {
            //     this.removeList.length = 0;
            // }
            //
            // //移除失效的元素
            // if (elem.parentElement == null) {
            //     elem.innerHTML = "";
            //     this.removeList.push(ind);
            // }
            //
            // if (ind === this.watcherLists.length - 1 && this.removeList.length > 0) {
            //     for (let i = this.removeList.length - 1; i >= 0; i--) {
            //         this.watcherLists.splice(this.removeList[i], 1);
            //     }
            //     this.removeList.length = 0;
            //     return;
            // }
            if (elem.parentElement == null) {
                return;
            }
            let retVal = bindFun.bindFunc(elem);
            if (key === "innerHTML") {
                dfvFront_1.dfvFront.setEle(elem, retVal);
                return;
            }
            if (elem.localName === "input" && elem.type === "radio" && key === "bind") {
                if (elem.value == retVal) {
                    elem.checked = true;
                }
                return;
            }
            if (retVal == null)
                elem[key] = "";
            else
                elem[key] = retVal;
        });
    }
    /**
     * 初始化可绑定对象
     * @param obj
     * @param parent 所属对象
     * @param field 字段名
     * @returns {any}
     */
    static init(obj, parent, field) {
        let type = typeof obj;
        let f_a = new BindField(obj, BindFieldType.string, field, parent);
        if (obj == null || type === "string" || obj instanceof Date) {
            f_a.type = BindFieldType.string;
        }
        else if (type === "number") {
            f_a.type = BindFieldType.number;
        }
        else if (type === "boolean") {
            f_a.type = BindFieldType.boolean;
        }
        else if (type === "function") {
            return;
        }
        else if (obj instanceof Array) {
            obj.__BindField__ = f_a;
            f_a.type = BindFieldType.array;
            for (let arr of obj) {
                BindField.init(arr);
            }
            let oldPush = obj.push;
            obj.push = function (val) {
                BindField.init(val);
                let ret = oldPush.call(obj, val);
                if (obj.__BindField__)
                    obj.__BindField__.execWatcherList();
                return ret;
            };
            let oldSplice = obj.splice;
            obj.splice = function () {
                let ret = oldSplice.apply(obj, arguments);
                if (obj.__BindField__)
                    obj.__BindField__.execWatcherList();
                return ret;
            };
            let sortOld = obj.sort;
            obj.sort = function (val) {
                let ret = sortOld.call(obj, val);
                if (obj.__BindField__)
                    obj.__BindField__.execWatcherList();
                return ret;
            };
            let popOld = obj.pop;
            obj.pop = function () {
                let ret = popOld.call(obj);
                if (obj.__BindField__)
                    obj.__BindField__.execWatcherList();
                return ret;
            };
        }
        else {
            f_a.type = BindFieldType.object;
            for (let k in obj) {
                if (typeof obj[k] === "function")
                    continue;
                BindField.init(obj[k], obj, k);
            }
        }
        if (parent && field) {
            delete parent[field];
            Object.defineProperty(parent, field, {
                get: function () {
                    if (BindField.getBindList && !BindField.bindListMap[f_a.uniqueId]) {
                        BindField.getBindList.push(f_a);
                        BindField.bindListMap[f_a.uniqueId] = true;
                    }
                    return f_a.getVal();
                },
                set: function (s) {
                    BindField.init(s);
                    f_a.setVal(s);
                },
                enumerable: true,
                configurable: true
            });
        }
    }
    toString() {
        return this.val + "";
    }
    valueOf() {
        return this.val;
    }
    toJSON() {
        return this.val;
    }
    getVal() {
        return this.val;
    }
    check() {
    }
    /**
     *
     * @param val
     * @param ele 附加数据，传递给setLists
     */
    setVal(val, ele) {
        this.val = val;
        this.execWatcherList(ele);
    }
    execWatcherList(ele) {
        for (let i = 0; i < this.watcherLists.length; i++) {
            this.watcherLists[i](this.val, ele, i);
        }
    }
}
/**
 * 用于从对象get属性获取BindField
 * @type {any}
 */
BindField.getBindList = null;
BindField.bindListMap = {};
BindField.autoId = 0;
exports.BindField = BindField;
//# sourceMappingURL=dfvBind.js.map