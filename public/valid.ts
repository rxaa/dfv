import {ClassMetaData, dfv, MapString} from "./dfv";
import {BindField} from "./dfvBind";
import {dfvFront} from "./dfvFront";


export enum validType{
    int,
    number,
    string,
    object,
    file,
}

export class IFieldRes<T> {
    /**
     * 接收到的值
     */
    val: T;
    /**
     * 错误提示
     */
    msg: string = valid.errMsg_;

    //字段缺省值
    defaul: T;

    /**
     * 验证成功与否
     */
    ok: boolean = false;

}


export interface IncomingFormParse {
    encoding: string;
    /**
     * 上传目录
     */
    uploadDir: string;
    keepExtensions: boolean;
    /**
     * 最大字段长度
     */
    maxFieldsSize: number;
    maxFields: number;
    hash: string | boolean;
    multiples: boolean;
    type: string;
    bytesReceived: number;
    bytesExpected: number;

    /**
     * 最大文件字节长度
     */
    maxFileSize?: number;

    /**
     * 文件开始下载前检测
     * @param name 字段名
     * @param file 文件信息
     */
    checkFile?: (name: string, file: FileMultiple) => boolean;

    /**
     * 所有已上传文件
     */
    fileList?: FileMultiple[];
    multipart: {
        fields: any, files: any,
    };
}

export interface FileMultiple {
    size: number;
    path: string;
    name: string;
    type: string;
    lastModifiedDate?: Date;
    hash?: string;

    toJSON(): Object;
}

export class valid {

    constructor(public func: (res: IFieldRes<any>) => boolean, public type: validType) {

    }

    static errMsg_ = " invalid";

    /**
     * 设置class的验证字段
     * @param obj
     * @param key
     * @param func
     */
    static setFieldCheckMetaData<T>(obj: ClassMetaData, key: string, func: (o: IFieldRes<T>) => boolean) {
        dfv.setData(obj, "fieldCheckMap", key, func);
    }

    static getFieldCheckMetaData(obj: ClassMetaData, key: string) {
        return dfv.getData(obj, "fieldCheckMap", key) as (o: IFieldRes<any>) => boolean;
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
    static int(func?: (num: IFieldRes<number>) => boolean, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<any>(target.constructor, propertyKey, obj => {
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
        }
    }

    /**
     * 整数+大于0验证
     * @param func
     * @param msg
     * @returns {function(Object, string): undefined}
     */
    static intNotZero(func?: ((num: IFieldRes<number>) => boolean) | null, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {

            if (index !== void 0)
                var parasName = dfv.getParasNameMeta(target, propertyKey);

            if (index !== void 0)
                propertyKey += index;

            valid.setFieldCheckMetaData<any>(target.constructor, propertyKey, obj => {
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
                        obj.msg = parasName[index]
                    else
                        obj.msg = propertyKey;
                    obj.msg += " must be greater than 0";
                }

                if (func) {
                    ret = func(obj);
                }
                return ret;
            });
        }
    }


    /**
     * 可为null整数
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static intNullAble(func?: ((num: IFieldRes<number | null>) => boolean) | null, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<any>(target.constructor, propertyKey, obj => {
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
        }
    }

    /**
     * 浮点数验证
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static float(func?: (num: IFieldRes<number>) => boolean, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<any>(target.constructor, propertyKey, obj => {
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
        }
    }

    /**
     * 数组验证（默认不遍历数组验证其内容，自行调用扩展函数：r.val.eachTo验证）
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static array<T>(func?: (num: IFieldRes<T[]>) => boolean, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<any[]>(target.constructor, propertyKey, obj => {
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
        }
    }

    /**
     * 文件验证
     * @param func
     * @param msg
     * @returns {exp}
     */
    static file(func?: (num: IFieldRes<FileMultiple>) => boolean, msg?: string): FileMultiple {
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
        }, validType.file) as any;
    }

    /**
     * 数组文件(form表单的重复name，或者后面加[])
     * @param func
     * @param msg
     * @returns {any}
     */
    static fileArray(func?: (num: IFieldRes<FileMultiple[]>) => boolean, msg?: string): FileMultiple[] {
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
        }, validType.file) as any;
    }


    static object<T>(func: (num: IFieldRes<T>) => boolean, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<any>(target.constructor, propertyKey, obj => {
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
        }
    }

    /**
     * 字符串+非空验证
     * @param func
     * @param msg
     * @returns {function(Object, string): undefined}
     */
    static stringNotEmpty(func?: RegExp | ((num: IFieldRes<string>) => boolean) | null, msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                var parasName = dfv.getParasNameMeta(target, propertyKey);

            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<string>(target.constructor, propertyKey, obj => {
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
                        obj.msg = parasName[index]
                    else
                        obj.msg = propertyKey;
                    obj.msg += " can not be empty"
                }

                if (func instanceof RegExp) {
                    ret = func.test(obj.val!);
                }
                else if (func instanceof Function) {
                    ret = func(obj);
                }

                return ret;
            });
        }
    }

    static string(func?: RegExp | ((num: IFieldRes<string>) => boolean), msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<string>(target.constructor, propertyKey, obj => {
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
                    ret = func.test(obj.val!);
                }
                else if (func instanceof Function) {
                    ret = func(obj);
                }

                return ret;
            });
        }
    }

    /**
     * 可为null的字串类型验证
     * @param func
     * @param msg
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static stringNullAble(func?: RegExp | ((num: IFieldRes<string | null>) => boolean), msg?: string) {
        return (target: Object, propertyKey: string, index?: number) => {
            if (index !== void 0)
                propertyKey += index;
            valid.setFieldCheckMetaData<string | null>(target.constructor, propertyKey, obj => {
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
                    ret = func.test(obj.val!);
                }
                else if (func instanceof Function) {
                    ret = func(obj);
                }

                return ret;
            });
        }
    }

    /**
     * 将对象转为可绑定对象
     * @param className 对象类名或对象
     * @returns {any}
     */
    static bindAble<T>(className: { new(): T } | T): T {
        if (typeof className === "function") {
            let ret = new (className as { new(): T })();
            BindField.init(ret)
            return ret;
        }
        BindField.init(className)
        return className as T;
    }


    /**
     * 验证数据（后端）
     * @param from 待验证数据
     * @param objRes
     * @returns {IFieldRes<T>}
     */
    static check<T>(from: T, objRes?: IFieldRes<T>): IFieldRes<T> {
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
    static checkObj<T extends any>(from: any, toObj: T, objRes?: IFieldRes<T>, from2?: any, valids?: any): IFieldRes<T> {
        if (objRes == null) {
            objRes = new IFieldRes<T>();
        }

        objRes.ok = true;

        for (var key in toObj) {
            objRes.defaul = toObj[key] as any;
            var type = typeof objRes.defaul;

            if (type === "function")
                continue;


            //来自valids的验证
            if (valids && objRes.defaul instanceof valid) {
                objRes.val = valids[key];
                objRes.msg = key + " " + valid.errMsg_;
                objRes.ok = (objRes.defaul as any as valid).func(objRes);

                toObj[key as any] = objRes.val;
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

                toObj[key as any] = objRes.val;

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
                objRes.val = parseFloat(objRes.val as any) as any;
                if (isNaN(objRes.val as any))
                    objRes.val = objRes.defaul;
            }
            else if (type === "string") {
                objRes.val = (objRes.val + "") as any;
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

            toObj[key as any] = objRes.val;
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
    static checkAsync<T>(from: T, objRes?: IFieldRes<T>): Promise<IFieldRes<T>> {
        return valid.checkObjAsync(from, from, objRes);
    }

    /**
     * 异步验证并转换数据(前端)
     * @param from 待验证数据
     * @param toObj 经类型转换后的验证结果
     * @param objRes IFieldRes
     * @returns {IFieldRes<T>}
     */
    static async checkObjAsync<T>(from: any, toObj: T, objRes?: IFieldRes<T>): Promise<IFieldRes<T>> {
        if (!objRes)
            objRes = new IFieldRes<any>();
        objRes.ok = true;
        var bindList: BindField[] = [];
        for (var key in from) {
            BindField.initGetBindList(bl => {
                objRes!.defaul = from[key];
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
                                await bind.onSet(objRes.val, bind, it);
                            } catch (e) {
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
    }

}