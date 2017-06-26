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
const valid_1 = require("./valid");
function dfvFuncExtInit() {
}
exports.dfvFuncExtInit = dfvFuncExtInit;
//这里因为this问题不能用lambda:()=>
String.prototype.removeLast = function () {
    return this.substr(0, this.length - 1);
};
Date.prototype.toJSON = function () {
    return this.valueOf();
};
String.prototype.htmlEncode = function () {
    var ret = "";
    for (var i = 0; i < this.length; i++) {
        var s = this.charAt(i);
        if (s === " ")
            ret += "&nbsp;";
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
};
if (!Array.prototype.map) {
    Array.prototype.map = function (callbackfn) {
        var arr = Array();
        for (var i = 0; i < this.length; i++) {
            arr.push(callbackfn(this[i], i, arr));
        }
        return arr;
    };
}
else if (!Array.prototype.eachToInt) {
    Object.defineProperty(Number.prototype, "loop", {
        value: function (func) {
            for (var i = 0; i < this; i++) {
                func(i);
            }
        },
        enumerable: false,
        writable: true,
    });
    Object.defineProperty(Number.prototype, "loopMap", {
        value: function (func) {
            var arr = Array();
            for (var i = 0; i < this; i++) {
                arr.push(func(i));
            }
            return arr;
        },
        enumerable: false,
        writable: true,
    });
    Object.defineProperty(Array.prototype, "add", {
        value: function (index, item) {
            this.splice(index, 0, item);
            return this;
        },
        enumerable: false,
        writable: true,
    });
    Object.defineProperty(Array.prototype, "mapString", {
        value: function (func) {
            var str = "";
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
        value: function (func) {
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
        value: function (func) {
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
        value: function (func) {
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
        value: function (func) {
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
        value: function (func) {
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
        value: function (className, msg) {
            if (msg == null)
                msg = new valid_1.IFieldRes();
            for (var i = 0; i < this.length; i++) {
                valid_1.valid.checkObj(this[i], new className(), msg);
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
        value: function (callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                var arr = new Array();
                for (var i = 0; i < this.length; i++) {
                    arr.push(yield callbackfn(this[i], i, arr));
                }
                return arr;
            });
        },
        enumerable: false,
    });
    Object.defineProperty(Array.prototype, "mapStringPromise", {
        value: function (callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                var str = "";
                for (var i = 0; i < this.length; i++) {
                    var ret = yield callbackfn(this[i], i);
                    if (ret != null)
                        str += ret;
                }
                return str;
            });
        },
        enumerable: false,
    });
}
//# sourceMappingURL=dfvFuncExt.js.map