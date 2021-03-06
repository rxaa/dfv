import { dfvFuncExtInit } from "./dfvFuncExt";

dfvFuncExtInit();

export interface MapString<T> {
    [index: string]: T;
}

export interface MapNumber<T> {
    [index: number]: T;
}


export let ARRAY_TYPE: any = "_ARR_TYPE";
if (typeof Symbol === "function") {
    ARRAY_TYPE = (Symbol as any).for("_ARR_TYPE")
}

export function arrayNumber(val?: number[]): number[] {
    if (!val) {
        val = []
    }
    (<any>val)[ARRAY_TYPE] = Number;
    // Object.defineProperty(val, "__type__", {
    //     value: Number,
    //     enumerable: false,
    // });
    return val;
}

export function arrayString(val?: string[]): string[] {
    if (!val) {
        val = []
    }
    (<any>val)[ARRAY_TYPE] = String;
    // Object.defineProperty(val, "__type__", {
    //     value: String,
    //     enumerable: false,
    // });
    return val;
}

export function array<T>(type: { new(...paras: any[]): T }, val?: T[]): T[] {
    if (!val) {
        val = []
    }
    (<any>val)[ARRAY_TYPE] = type;
    // Object.defineProperty(val, "__type__", {
    //     value: type,
    //     enumerable: false,
    // });
    return val;
}

export interface ShowAbleErr extends Error {
    showMsg: boolean;
}

const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const DEFAULT_PARAMS = /=[^,]+/mg;
const FAT_ARROWS = /=>.*$/mg;

export class dfv {

    static root = "";


    static meta = {
        type: "design:type",
        paraType: "design:paramtypes",
        returnType: "design:returntype",
    }

    static sleep(time: number) {
        return new Promise((reso, reject) => {
            setTimeout(() => {
                try {
                    reso();
                } catch (e) {
                    reject(e)
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
    static compare(l: any, r: any): number {
        if (l.localeCompare) {
            return l.localeCompare(r);
        }
        return l - r;
    }


    private static funcReg = /function\s*(\w*)/i;

    /**
     * 生成可显示（带showMsg属性）异常
     * @param msg
     * @returns {Error}
     */
    static err(msg: string) {
        var err = Error(msg);
        (err as ShowAbleErr).showMsg = true;
        return err;
    }


    /**
     * 获取函数名
     * @param func
     * @returns {any}
     */
    static getFuncName(func: Function) {
        if ((func as any).name !== void 0)
            return (func as any).name;

        var matches = dfv.funcReg.exec(func + "");
        if (matches)
            return matches[1];

        return "";
    }

    static dateToY_M_D(p: Date | number | string, symb = "-") {
        let d = p instanceof Date ? p as Date : new Date(p as any);
        return d.getFullYear() + symb + (d.getMonth() + 1) + symb + d.getDate();
    }


    static dateToY_M_D_H_M_S(p: Date | number | string, showSecond = true) {

        let d = p instanceof Date ? p as Date : new Date(p as any);
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " "
            + d.getHours() + ":" + d.getMinutes() + (showSecond ? (":" + d.getSeconds()) : "");
    }

    static now() {
        return Date.now();
    }

    static nowSec() {
        return Math.floor(Date.now() / 1000);
    }

    static getArrayType(val: any) {
        return val[ARRAY_TYPE];
    }

    static setPrototypeOf(target: any, proto: any) {
        if ((Object as any).setPrototypeOf)
            (Object as any).setPrototypeOf(target, proto);
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

    /**
    * 从指定类中排除字段,生成新类
    * @param obj 指定类
    * @param p1 排除的字段集合
    */
    static classOmit<T, T2 extends keyof T>(obj: { new(): T }, ...p1: T2[]): { new(obj?: T): Omit<T, T2> } {
        let fMap: {
            [key: string]: boolean;
        } = {};

        for (let f of p1) {
            fMap[f as string] = true;
        }

        let OmitClass: any = function (this: T, dat?: T) {
            if (dat == null)
                dat = new obj();
            for (let k in dat) {
                if (!fMap[k])
                    this[k] = dat[k];
            }
        };
        OmitClass._omit = obj;

        return OmitClass;
    }

    /**
     * 将所有obj合并到v1里
     * @returns {any}
     * @param v1
     * @param v2
     * @param v3
     * @param v4
     * @param v5
     */
    static joinObjFast<T1, T2, T3, T4, T5>(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5): T1 & T2 & T3 & T4 & T5
    static joinObjFast<T1, T2, T3, T4>(v1: T1, v2: T2, v3: T3, v4: T4): T1 & T2 & T3 & T4
    static joinObjFast<T1, T2, T3>(v1: T1, v2: T2, v3: T3): T1 & T2 & T3
    static joinObjFast<T1, T2>(v1: T1, v2: T2): T1 & T2
    static joinObjFast(...values: any[]) {
        var first = values[0];
        for (var i = 1; i < values.length; i++) {
            var next = values[i];
            for (var key in next) {
                first[key] = next[key];
            }
        }
        return first;
    }


    /**
     * 合并多个个对象,返回新对象
     * @returns {any}
     */
    static joinObj<T1, T2, T3, T4, T5>(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5): T1 & T2 & T3 & T4 & T5
    static joinObj<T1, T2, T3, T4>(v1: T1, v2: T2, v3: T3, v4: T4): T1 & T2 & T3 & T4
    static joinObj<T1, T2, T3>(v1: T1, v2: T2, v3: T3): T1 & T2 & T3
    static joinObj<T1, T2>(v1: T1, v2: T2): T1 & T2
    static joinObj(...values: any[]) {
        let clas: any = function () {

        }
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
    static leftJoin<TL, TR>(left: Array<TL>, right: Array<TR>, funcL: (l: TL) => any, funcR: (l: TR) => any, overrideLeft?: boolean): Array<TL
        & TR> {
        if (!right || right.length < 1)
            return left as Array<TL & TR>;

        return dfv.leftJoinMap(left, dfv.arrToMap(right, funcR), funcL, overrideLeft);
    }

    /**
     * 返回函数体内容字串
     * @param func
     * @returns {string}
     */
    static getFuncBody(func: Function) {
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
    static arrToMap<TR>(right: Array<TR>, funcR: (l: TR) => any, filter?: (l: TR) => boolean): MapString<TR> {
        let rightMap: MapString<TR> = {};
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
    static mapToArr<T>(right: MapString<T>, filter?: (key: string, val: T) => boolean): T[] {
        let ret = Array<any>();
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
    static isInt(val: string) {
        if (val == null || val.length == 0) {
            return false;
        }

        for (var u of val) {
            if (u < '0' || u > '9')
                return false;
        }

        return true;
    }

    static showByte(num: number) {
        if (num <= 1024) {
            return "" + num + " Byte"
        }

        if (num <= 1024 * 1024) {
            return (num / 1024).toFixed(1) + " KB"
        }

        if (num <= 1024 * 1024 * 1024) {
            return (num / 1024.0 / 1024.0).toFixed(1) + " MB"
        }

        return (num / 1024.0 / 1024.0 / 1024.0).toFixed(1) + " GB";
    }

    static leftJoinMap<TL, TR>(left: Array<TL>, right: MapString<TR>, funcL: (l: TL) => any, overrideLeft?: boolean): Array<TL
        & TR> {
        if (!left || left.length < 1)
            return left as Array<TL & TR>;

        for (let i = 0; i < left.length; i++) {
            let lObj: any = left[i];
            let rObj: any = right[funcL(lObj)];
            if (rObj) {
                if (overrideLeft) {
                    for (let na in rObj) {
                        lObj[na as any] = rObj[na];
                    }
                }
                else {
                    for (let na in rObj) {
                        if (lObj[na as any] == null)
                            lObj[na as any] = rObj[na];
                    }
                }
            }
        }
        return left as Array<TL & TR>;
    }


    /**
     * 将_下划线命名法替换为首字母大写驼峰式
     * @param name
     * @param symble
     * @param filterCode
     * @returns {string}
     */
    static fixNameUpperCase(name: string, symble?: string, filterCode?: string) {
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

    private static autoInc = 0;

    static getAutoInc() {
        return dfv.autoInc++;
    }

    private static hexString = "0123456789abcdefghijklmnopqrstuvwxyz";


    /**
     * 产生[0,num)以内的随机数
     * @param num
     * @returns {number}
     */
    static randomInt(num: number) {
        return Math.floor(Math.random() * num);
    }

    /**
     * 获取定长10进制随机数
     * @param len 长度
     * @returns {string}
     */
    static getRandFixNum(len: number) {
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
    static getData(clas: ClassMetaData, metaKey: string, field: string): any {
        if (!clas)
            return void 0;

        var ret: any;
        if (clas._fieldMetaDataMap_)
            ret = clas._fieldMetaDataMap_[dfv.getKey(metaKey, field)];

        if (ret === void 0) {
            var parent = (clas as any).__proto__;
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
    static setData(classType: ClassMetaData, metaKey: string, field: string, data: any) {
        if (!classType._fieldMetaDataMap_)
            classType._fieldMetaDataMap_ = {};
        classType._fieldMetaDataMap_[dfv.getKey(metaKey, field)] = data;
    }

    private static getKey(metaKey: String, field: string) {
        return "_" + metaKey + "_" + field + "_";
    }


    /**
     * 获取类的父类,没有返回空数组
     * @param clas
     * @returns {any}
     */
    static getParent(clas: { new(): any; } | Function): { new(): any; }[] {
        let ret = Array<{ new(): any; }>();
        let cl = Object.getPrototypeOf(clas);
        if (cl && cl instanceof Function) {
            ret.push(cl);
        }

        let meta = dfv.getData(clas, "class_parent", "") as any[];
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
    static setParent(clas: { new(): any; } | Function, parent: { new(): any; } | Function) {
        let meta = dfv.getData(clas, "class_parent", "") as any[];
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
    static hashCode(str: string) {
        var hash = 0, i, chr, len;
        if (str.length === 0) return hash;
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
    static getFileName(file: string) {
        let pos = file.lastIndexOf("/");
        if (pos >= 0) {
            return file.substring(pos + 1, file.length)
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
    static getParameterNames(fn: Function): Array<string> {
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
    private static setParasNameMeta(clas: Function, method: string, paras: Array<string>) {
        dfv.setData(clas, "paras_name", method, paras);
    }

    /**
     * 获取指定类的方法的参数名元信息
     * @returns {Array<string>}
     * @param target class实例
     * @param propertyKey
     */
    static getParasNameMeta(target: Object, propertyKey: string) {
        let ret = dfv.getData(target.constructor, "paras_name", propertyKey) as Array<string> | undefined;
        if (!ret) {
            let func = (target as any)[propertyKey];
            if (!func)
                throw Error((target.constructor as any).name + " not have " + propertyKey);
            ret = dfv.getParameterNames(func)
            dfv.setParasNameMeta(target.constructor, propertyKey, ret);
        }
        return ret as Array<string>;
    }

    /**
     * 读取字串的所有行
     * @param str 目标字串
     * @param func 读取结果(返回false中断遍历)
     */
    static readLine(str: string, func: (line: string) => void | boolean) {
        let line = "";
        for (var i = 0; i < str.length; i++) {
            var c = str[i];
            if (c === "\n") {
                if (func(line) === false)
                    return;

                line = "";
                continue;
            }

            if (c === "\r")
                continue;

            line += c;
        }
        if (line.length > 0)
            func(line);
    }
}


/**
 * 通过@装饰器设置的class的元数据
 */
export interface ClassMetaData extends Function {
    _fieldMetaDataMap_?: MapString<Object>;
}