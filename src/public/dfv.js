"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dfvFuncExt_1 = require("./dfvFuncExt");
dfvFuncExt_1.dfvFuncExtInit();
exports.ARRAY_TYPE = "_ARR_TYPE";
if (typeof Symbol === "function") {
    exports.ARRAY_TYPE = Symbol.for("_ARR_TYPE");
}
function arrayNumber(val) {
    if (!val) {
        val = [];
    }
    val[exports.ARRAY_TYPE] = Number;
    // Object.defineProperty(val, "__type__", {
    //     value: Number,
    //     enumerable: false,
    // });
    return val;
}
exports.arrayNumber = arrayNumber;
function arrayString(val) {
    if (!val) {
        val = [];
    }
    val[exports.ARRAY_TYPE] = String;
    // Object.defineProperty(val, "__type__", {
    //     value: String,
    //     enumerable: false,
    // });
    return val;
}
exports.arrayString = arrayString;
function array(type, val) {
    if (!val) {
        val = [];
    }
    val[exports.ARRAY_TYPE] = type;
    // Object.defineProperty(val, "__type__", {
    //     value: type,
    //     enumerable: false,
    // });
    return val;
}
exports.array = array;
const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const DEFAULT_PARAMS = /=[^,]+/mg;
const FAT_ARROWS = /=>.*$/mg;
class dfv {
    static sleep(time) {
        return new Promise((reso, reject) => {
            setTimeout(() => {
                try {
                    reso();
                }
                catch (e) {
                    reject(e);
                }
            }, time);
        });
    }
    /**
     * 比较数字或字串
     * @param l
     * @param r
     * @returns {number}
     */
    static compare(l, r) {
        if (l.localeCompare) {
            return l.localeCompare(r);
        }
        return l - r;
    }
    /**
     * 生成可显示（带showMsg属性）异常
     * @param msg
     * @returns {Error}
     */
    static err(msg) {
        var err = Error(msg);
        err.showMsg = true;
        return err;
    }
    /**
     * 获取函数名
     * @param func
     * @returns {any}
     */
    static getFuncName(func) {
        if (func.name !== void 0)
            return func.name;
        var matches = dfv.funcReg.exec(func + "");
        if (matches)
            return matches[1];
        return "";
    }
    static dateToY_M_D(p, symb = "-") {
        let d = typeof p === "number" ? new Date(p) : p;
        return d.getFullYear() + symb + (d.getMonth() + 1) + symb + d.getDate();
    }
    static dateToY_M_D_H_M_S(p, showSecond = true) {
        let d = typeof p === "number" ? new Date(p) : p;
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " "
            + d.getHours() + ":" + d.getMinutes() + (showSecond ? (":" + d.getSeconds()) : "");
    }
    static now() {
        return Date.now();
    }
    static nowSec() {
        return Math.floor(Date.now() / 1000);
    }
    static getArrayType(val) {
        return val[exports.ARRAY_TYPE];
    }
    static setPrototypeOf(target, proto) {
        if (Object.setPrototypeOf)
            Object.setPrototypeOf(target, proto);
        else if (target.__proto__) {
            target.__proto__ = proto;
        }
        else {
            /** IE9 fix - copy object methods from the protype to the new object **/
            for (var prop in proto) {
                target[prop] = proto[prop];
            }
        }
    }
    static joinObjFast(...values) {
        var first = values[0];
        for (var i = 1; i < values.length; i++) {
            var next = values[i];
            for (var key in next) {
                first[key] = next[key];
            }
        }
        return first;
    }
    static joinObj(...values) {
        let clas = function () {
        };
        let newObj = new clas();
        for (var i = 0; i < values.length; i++) {
            var next = values[i];
            dfv.setParent(newObj.constructor, next.constructor);
            for (var key in next) {
                newObj[key] = next[key];
            }
        }
        return newObj;
    }
    /**
     * 联合两个Array,例子:sdf.leftJoin(ArrayL, ArrayR, ArrayL=>ArrayL.lid, ArrayR=>ArrayR.rid);
     * @param left 左表,funcL里的外键字段,值可重复
     * @param right 右表,funcR里的主键字段,不能有重复值
     * @param funcL 左表外键回调
     * @param funcR 右表主键回调
     * @param overrideLeft 是否覆盖左表重复的键值
     * @returns {Array<TL&TR>}
     */
    static leftJoin(left, right, funcL, funcR, overrideLeft) {
        if (!right || right.length < 1)
            return left;
        return dfv.leftJoinMap(left, dfv.arrToMap(right, funcR), funcL, overrideLeft);
    }
    /**
     * 返回函数体内容字串
     * @param func
     * @returns {string}
     */
    static getFuncBody(func) {
        let funStr = func + "";
        let i = funStr.indexOf("=>");
        if (i > 0) {
            return funStr.substring(i + 2, funStr.length);
        }
        return funStr;
    }
    /**
     * 将Array映射为Map
     * @param right
     * @param funcR 作为Map键值的字段回调函数
     * @param filter filter过滤回调
     * @returns {MapString<TR>}
     */
    static arrToMap(right, funcR, filter) {
        let rightMap = {};
        if (filter) {
            for (let i = 0; i < right.length; i++) {
                let rObj = right[i];
                if (filter(rObj))
                    rightMap[funcR(rObj)] = rObj;
            }
        }
        else {
            for (let i = 0; i < right.length; i++) {
                let rObj = right[i];
                rightMap[funcR(rObj)] = rObj;
            }
        }
        return rightMap;
    }
    /**
     * 将map映射为array
     * @param right
     * @param filter filter过滤回调
     * @returns {Array}
     * @constructor
     */
    static mapToArr(right, filter) {
        let ret = Array();
        if (filter) {
            for (var k in right) {
                let val = right[k];
                if (filter(k, val))
                    ret.push(val);
            }
        }
        else {
            for (var k in right) {
                ret.push(right[k]);
            }
        }
        return ret;
    }
    /**
     * 判断是否整数
     * @param val
     * @returns {boolean}
     */
    static isInt(val) {
        if (val == null || val.length == 0) {
            return false;
        }
        for (var u of val) {
            if (u < '0' || u > '9')
                return false;
        }
        return true;
    }
    static showByte(num) {
        if (num <= 1024) {
            return "" + num + " Byte";
        }
        if (num <= 1024 * 1024) {
            return (num / 1024).toFixed(1) + " KB";
        }
        if (num <= 1024 * 1024 * 1024) {
            return (num / 1024.0 / 1024.0).toFixed(1) + " MB";
        }
        return (num / 1024.0 / 1024.0 / 1024.0).toFixed(1) + " GB";
    }
    static leftJoinMap(left, right, funcL, overrideLeft) {
        if (!left || left.length < 1)
            return left;
        for (let i = 0; i < left.length; i++) {
            let lObj = left[i];
            let rObj = right[funcL(lObj)];
            if (rObj) {
                if (overrideLeft) {
                    for (let na in rObj) {
                        lObj[na] = rObj[na];
                    }
                }
                else {
                    for (let na in rObj) {
                        if (lObj[na] == null)
                            lObj[na] = rObj[na];
                    }
                }
            }
        }
        return left;
    }
    /**
     * 将_下划线命名法替换为首字母大写驼峰式
     * @param name
     * @param symble
     * @param filterCode
     * @returns {string}
     */
    static fixNameUpperCase(name, symble, filterCode) {
        if (symble == "") {
            symble = "_";
        }
        let ret = "";
        for (let i = 0; i < name.length; i++) {
            let c = name[i];
            if (c === filterCode)
                continue;
            if (c == symble) {
                i++;
                if (i < name.length)
                    ret += name[i].toUpperCase();
                continue;
            }
            ret += c;
        }
        return ret;
    }
    static getAutoInc() {
        return dfv.autoInc++;
    }
    /**
     * 产生[0,num)以内的随机数
     * @param num
     * @returns {number}
     */
    static randomInt(num) {
        return Math.floor(Math.random() * num);
    }
    /**
     * 获取定长10进制随机数
     * @param len 长度
     * @returns {string}
     */
    static getRandFixNum(len) {
        var ret = "";
        for (var i = 0; i < len; i++) {
            ret += Math.floor(Math.random() * 10);
        }
        return ret;
    }
    /**
     * 获取22位16进制的唯一id
     * @returns {string}
     */
    static getUniqueId() {
        dfv.autoInc += 1;
        if (dfv.autoInc >= 0xFFFFF)
            dfv.autoInc = 0;
        var ret = Date.now().toString(16) + "" + dfv.autoInc.toString(16);
        for (var i = ret.length; i < 11 + 5; i++) {
            ret += "0";
        }
        for (var i = 0; i < 6; i++) {
            ret += dfv.hexString[dfv.randomInt(16)];
        }
        return ret;
    }
    /**
     * 获取16位36进制的唯一id
     * @returns {string}
     */
    static getUniqueId16() {
        dfv.autoInc += 1;
        if (dfv.autoInc >= 1679616)
            dfv.autoInc = 0;
        var ret = Date.now().toString(36) + dfv.autoInc.toString(36);
        for (var i = ret.length; i < 8 + 4; i++) {
            ret += "0";
        }
        for (var i = 0; i < 4; i++) {
            ret += dfv.hexString[dfv.randomInt(36)];
        }
        return ret;
    }
    /**
     * 获取class@装饰器设置的元数据
     * @param clas class名
     * @param metaKey 元数据键值
     * @param field class成员名
     * @returns {any} 未找到返回null
     */
    static getData(clas, metaKey, field) {
        if (!clas)
            return void 0;
        var ret;
        if (clas._fieldMetaDataMap_)
            ret = clas._fieldMetaDataMap_[dfv.getKey(metaKey, field)];
        if (ret === void 0) {
            var parent = clas.__proto__;
            // var parent = Object.getPrototypeOf(clas);
            if (parent && parent instanceof Function)
                return dfv.getData(parent, metaKey, field);
            else
                return void 0;
        }
        return ret;
    }
    /**
     * 设置class的元数据
     * @param classType
     * @param metaKey 元数据键值
     * @param field class成员名
     * @param data
     */
    static setData(classType, metaKey, field, data) {
        if (!classType._fieldMetaDataMap_)
            classType._fieldMetaDataMap_ = {};
        classType._fieldMetaDataMap_[dfv.getKey(metaKey, field)] = data;
    }
    static getKey(metaKey, field) {
        return "_" + metaKey + "_" + field + "_";
    }
    /**
     * 获取类的父类,没有返回空数组
     * @param clas
     * @returns {any}
     */
    static getParent(clas) {
        let ret = Array();
        let cl = Object.getPrototypeOf(clas);
        if (cl && cl instanceof Function) {
            ret.push(cl);
        }
        let meta = dfv.getData(clas, "class_parent", "");
        if (meta) {
            for (let m of meta) {
                ret.push(m);
            }
        }
        return ret;
    }
    /**
     * 设置clas的parent元信息
     * @param clas
     * @param parent
     */
    static setParent(clas, parent) {
        let meta = dfv.getData(clas, "class_parent", "");
        if (meta == null) {
            meta = [];
            dfv.setData(clas, "class_parent", "", meta);
        }
        let par = dfv.getParent(parent);
        if (par.length > 0)
            par.forEach(it => meta.push(it));
        meta.push(parent);
    }
    /**
     * 生成字串的hase值
     * @param str
     * @returns {number}
     */
    static hashCode(str) {
        var hash = 0, i, chr, len;
        if (str.length === 0)
            return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    /**
     * 从字串中截取文件名
     * @param file
     * @returns {any}
     */
    static getFileName(file) {
        let pos = file.lastIndexOf("/");
        if (pos >= 0) {
            return file.substring(pos + 1, file.length);
        }
        return "";
    }
    static tempMenu() {
        return dfv.root + "/runtime/temp/";
    }
    /**
     * 获取当前缓存目录
     */
    static getTemp() {
        let now = new Date();
        return dfv.tempMenu() + now.getDate() + "/";
    }
    /**
     * 获取函数参数名别表
     * @param fn
     * @returns {Array|RegExpMatchArray}
     */
    static getParameterNames(fn) {
        var code = fn.toString()
            .replace(COMMENTS, '')
            .replace(FAT_ARROWS, '')
            .replace(DEFAULT_PARAMS, '');
        var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
            .match(/([^\s,]+)/g);
        return result === null
            ? []
            : result;
    }
    /**
     * 设置指定类的方法的参数名元信息
     * @param clas
     * @param method
     * @param paras
     */
    static setParasNameMeta(clas, method, paras) {
        dfv.setData(clas, "paras_name", method, paras);
    }
    /**
     * 获取指定类的方法的参数名元信息
     * @returns {Array<string>}
     * @param target class实例
     * @param propertyKey
     */
    static getParasNameMeta(target, propertyKey) {
        let ret = dfv.getData(target.constructor, "paras_name", propertyKey);
        if (!ret) {
            let func = target[propertyKey];
            if (!func)
                throw Error(target.constructor.name + " not have " + propertyKey);
            ret = dfv.getParameterNames(func);
            dfv.setParasNameMeta(target.constructor, propertyKey, ret);
        }
        return ret;
    }
}
dfv.root = "";
dfv.meta = {
    type: "design:type",
    paraType: "design:paramtypes",
    returnType: "design:returntype",
};
dfv.funcReg = /function\s*(\w*)/i;
dfv.autoInc = 0;
dfv.hexString = "0123456789abcdefghijklmnopqrstuvwxyz";
exports.dfv = dfv;
//# sourceMappingURL=dfv.js.map