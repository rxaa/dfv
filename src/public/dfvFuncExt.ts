import {IFieldRes, valid} from "./valid";
export function dfvFuncExtInit() {

}

declare global {
    export interface String {
        /**
         * 移除最后一个字符
         */
        removeLast(): string;
        /**
         * html转义
         */
        htmlEncode(): string;

    }
    export interface Number {
        /**
         * 循环number次
         */
        loop(func: (index: number) => void): void;
        /**
         * 循环number次,并将func返回值map成Array
         */
        loopMap<T>(func: (index: number) => T): Array<T>;

    }

    export interface Array<T> {

        /**
         * 遍历数组,func返回false则中断
         * @param func
         */
        each(func: (val: T) => boolean): boolean;

        /**
         * 遍历并转换数组成员为int,遇到NaN返回false,func返回false则中断
         */
        eachToInt(func?: (val: number) => boolean): boolean;

        /**
         *遍历并转换数组成员为float,func返回false则中断
         */
        eachToFloat(func?: (val: number) => boolean): boolean;

        /**
         *遍历并转换数组成员为string,func返回false则中断
         */
        eachToString(func?: (val: string) => boolean): boolean;

        /**
         * 遍历并验证转换数组成员为object
         * @param className 类名
         * @param msg 验证信息
         */
        eachToObj<U>(className: { new(): U; }, msg?: IFieldRes<U>): boolean;


        /**
         * 二分查找,返回索引位置(未找到返回-1)
         * @param func
         */
        binarySearch(func: (itm: T) => number): number;


        /**
         * 遍历array并将func返回结果拼接为string
         */
        mapString(func: (itm: T, index: number) => any): string;

        /**
         * 像指定位置添加元素
         * @param index
         * @param val
         */
        add(index: number, val: T | T[]): this;

        /**
         * 同map函数，支持async与await
         * @param callbackfn
         */
        mapPromise<U>(callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]>;
        /**
         * 遍历array并将func返回结果拼接为string,支持async与await
         * @param callbackfn
         */
        mapStringPromise(callbackfn: (value: T, index: number) => Promise<any>): Promise<string>;

    }
}

//这里因为this问题不能用lambda:()=>
String.prototype.removeLast = function () {
    return this.substr(0, this.length - 1);
}


Date.prototype.toJSON = function () {
    return this.valueOf() as any;
}


String.prototype.htmlEncode = function (): string {
    var ret = "";
    for (var i = 0; i < this.length; i++) {
        var s = this.charAt(i);
        if (s === " ")
            ret += "&nbsp;"
        else if (s === "<")
            ret += "&lt;";
        else if (s === ">")
            ret += "&gt;";
        else if (s === "&")
            ret += "&amp;";
        else
            ret += s;
    }

    return ret;
}


if (!Array.prototype.map) {
    Array.prototype.map = function (this: Array<any>, callbackfn: (value: any, index: number, array: any[]) => any) {
        var arr = Array<any>();
        for (var i = 0; i < this.length; i++) {
            arr.push(callbackfn(this[i], i, arr));
        }
        return arr;
    } as any
}
else if (!Array.prototype.eachToInt) {

    Object.defineProperty(Number.prototype, "loop", {
        value: function (func: (index: number) => void) {
            for (var i = 0; i < this; i++) {
                func(i);
            }
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Number.prototype, "loopMap", {
        value: function (func: (index: number) => any) {
            var arr = Array<any>();
            for (var i = 0; i < this; i++) {
                arr.push(func(i));
            }
            return arr;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "add", {
        value: function (this: Array<any>, index: number, item: any) {
            this.splice(index, 0, item);
            return this;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "mapString", {
        value: function (this: Array<any>, func: (itm: any, index: number) => any) {
            var str = ""
            for (var i = 0; i < this.length; i++) {
                var ret = func(this[i], i);
                if (ret != null)
                    str += ret;
            }
            return str;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "binarySearch", {
        value: function (this: Array<any>, func: (itm: any) => number): number {
            var startIndex = 0;
            var stopIndex = this.length - 1;


            while (startIndex <= stopIndex) {
                var middle = (stopIndex + startIndex) >>> 1;

                var ret = func(this[middle]);
                if (ret < 0) {
                    stopIndex = middle - 1;
                }
                else if (ret > 0) {
                    startIndex = middle + 1;
                }
                else {
                    return middle;
                }
            }

            return -1;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "eachToInt", {
        value: function (this: Array<any>, func?: (val: number) => boolean) {
            for (var i = 0; i < this.length; i++) {
                this[i] = parseInt(this[i]);
                if (isNaN(this[i])) {
                    this[i] = 0;
                    return false;
                }
                if (func) {
                    if (!func(this[i]))
                        return false;
                }

            }
            return true;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "each", {
        value: function (this: Array<any>, func: (val: any) => boolean): boolean {
            for (var i = 0; i < this.length; i++) {
                if (!func(this[i]))
                    return false;
            }
            return true;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "eachToFloat", {
        value: function (this: Array<any>, func?: (val: number) => boolean) {
            for (var i = 0; i < this.length; i++) {
                this[i] = parseFloat(this[i]);
                if (isNaN(this[i])) {
                    this[i] = 0;
                    return false;
                }

                if (func) {
                    if (!func(this[i]))
                        return false;
                }
            }
            return true;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "eachToString", {
        value: function (this: Array<any>, func?: (val: string) => boolean) {
            for (var i = 0; i < this.length; i++) {
                this[i] = this[i] + "";
                if (func) {
                    if (!func(this[i]))
                        return false;
                }
            }
            return true;
        },
        enumerable: false,
        writable: true,
    });
    Object.defineProperty(Array.prototype, "eachToObj", {
        value: function (this: Array<any>, className: { new(): any; }, msg?: IFieldRes<any>): boolean {
            if (msg == null)
                msg = new IFieldRes();

            for (var i = 0; i < this.length; i++) {
                valid.checkObj(this[i], new className(), msg);
                this[i] = msg.val;
                if (!msg.ok)
                    return false;
            }
            return true;
        },
        enumerable: false,
        writable: true,
    });

    Object.defineProperty(Array.prototype, "mapPromise", {
        value: async function (this: Array<any>, callbackfn: (value: any, index: number, array: any[]) => Promise<any>) {
            var arr = new Array<any>();
            for (var i = 0; i < this.length; i++) {
                arr.push(await callbackfn(this[i], i, arr));
            }
            return arr;
        },
        enumerable: false,
    });


    Object.defineProperty(Array.prototype, "mapStringPromise", {
        value: async function (this: Array<any>, callbackfn: (value: any, index: number) => Promise<any>) {
            var str = ""
            for (var i = 0; i < this.length; i++) {
                var ret = await callbackfn(this[i], i);
                if (ret != null)
                    str += ret;
            }
            return str;
        },
        enumerable: false,
    });
}


