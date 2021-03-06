"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
const dfv_1 = require("./dfv");
class sql {
    constructor(func) {
        this.func = func;
    }
    /**
     * sql值转义
     * @param val
     * @returns
     */
    static filter(val) {
        if (val == null)
            return "NULL";
        if (typeof val === "number")
            return val + '';
        var ret = "'";
        var str = val.toString();
        for (var i = 0; i < str.length; i++) {
            var s = str.charAt(i);
            if (s == "\\") {
                ret += "\\\\";
            }
            else if (s == "'") {
                ret += "\\'";
            }
            else {
                ret += s;
            }
        }
        return ret + "'";
    }
    static setTableInfo(obj) {
        Object.defineProperty(obj, "__tableInfo_", {
            value: true,
            enumerable: false,
            writable: true,
        });
    }
    static isTableInfo(obj) {
        return obj && obj.__tableInfo_;
    }
    /**
     * 不做escape处理字串
     * @returns {any}
     * @param template
     * @param substitutions
     */
    static src(template, ...substitutions) {
        return new sql(() => {
            var ret = "";
            var i = 0;
            for (; i < substitutions.length; i++) {
                ret += template[i];
                var val = substitutions[i];
                if (sql.isTableInfo(val))
                    ret += val;
                else
                    ret += sql.filter(val);
            }
            if (i < template.length) {
                ret += template[i];
            }
            return ret;
        });
    }
    /**
     * 当前日期和时间->2014-12-17 15:59:02
     * @returns {any}
     */
    static now() {
        return new sql(() => {
            return "now()";
        });
    }
    /**
     * 当前日期->2014-12-17
     * @returns {any}
     */
    static curDate() {
        return new sql(() => {
            return "CURDATE()";
        });
    }
    /**
     * 当前时间->15:59:02
     * @returns {any}
     */
    static curTime() {
        return new sql(() => {
            return "CURTIME()";
        });
    }
    /**
     * 以UNIX时间戳的形式返回当前时间->1418803177
     * @returns {any}
     */
    static unixTimeStamp() {
        return new sql(() => {
            return "UNIX_TIMESTAMP()";
        });
    }
    static primaryKey(target, propertyKey) {
        dfv_1.dfv.setData(target.constructor, "sql.primaryKey", "", propertyKey);
        // (target.constructor as ModMetaData)._primaryKeyName_ = propertyKey;
    }
    static getPrimaryKey(table) {
        return dfv_1.dfv.getData(table, "sql.primaryKey", "");
    }
    static autoIncrement(target, propertyKey) {
        dfv_1.dfv.setData(target.constructor, "sql.autoIncrement", propertyKey, true);
        // (target.constructor as ModMetaData)._primaryKeyName_ = propertyKey;
    }
    static getAutoIncrement(table, propertyKey) {
        return dfv_1.dfv.getData(table, "sql.autoIncrement", propertyKey);
    }
    /**
     * 全文索引
     * @param options
     */
    static indexText(options) {
        return (target, propertyKey) => {
            dfv_1.dfv.setData(target.constructor, "sql.index", propertyKey, "text");
        };
    }
    /**
     * 正序索引
     * @param options
     */
    static index(options) {
        return (target, propertyKey) => {
            dfv_1.dfv.setData(target.constructor, "sql.index", propertyKey, 1);
        };
    }
    /**
     * 倒序索引
     * @param options
     */
    static indexDesc(options) {
        return (target, propertyKey) => {
            dfv_1.dfv.setData(target.constructor, "sql.index", propertyKey, -1);
        };
    }
    /**
     * 原始格式索引数据,例如组合索引{field:1,field2:-1}
     * @param obj
     * @param options
     */
    static indexRaw(obj, options) {
        return (target, propertyKey) => {
            dfv_1.dfv.setData(target.constructor, "sql.index", propertyKey, obj);
        };
    }
    static getIndex(table, field) {
        return dfv_1.dfv.getData(table, "sql.index", field);
    }
    /**
     * 指定sql对象缓存的查询id
     * @param target
     * @param propertyKey
     */
    static cacheId(target, propertyKey) {
        dfv_1.dfv.setData(target.constructor, "sql.cacheId", "", propertyKey);
        // (target.constructor as ModMetaData)._primaryKeyName_ = propertyKey;
    }
    static getCacheId(table) {
        return dfv_1.dfv.getData(table, "sql.cacheId", "");
    }
    static cacheWhere(func) {
        return ((target) => {
            dfv_1.dfv.setData(target, "sql.cacheWhere", "", func);
        });
    }
    static getCacheWhere(table) {
        return dfv_1.dfv.getData(table, "sql.cacheWhere", "");
    }
    /**
     * 指定字段为别名
     * @param name 字段在数据库中的实际名称
     * @returns {function(Object, string): undefined}
     */
    static fieldName(name) {
        return (target, propertyKey) => {
            dfv_1.dfv.setData(target.constructor, "sql.fieldName", propertyKey, name);
        };
    }
    static getFieldName(table, field) {
        return dfv_1.dfv.getData(table, "sql.fieldName", field);
    }
    /**
     * 指定字段所属表
     * @param name
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static fieldTable(name) {
        return (target, propertyKey) => {
            if (typeof name === "string") {
                dfv_1.dfv.setData(target.constructor, "sql.fieldTable", propertyKey, name);
            }
            else {
                dfv_1.dfv.setData(target.constructor, "sql.fieldTable", propertyKey, name.name);
            }
        };
    }
    static getFieldTable(table, field) {
        return dfv_1.dfv.getData(table, "sql.fieldTable", field);
    }
    /**
     * 指定表别名
     * @param name 字串或表class
     * @returns {function({new(): any}): undefined}
     */
    static tableName(name) {
        return (target) => {
            if (typeof name === "string")
                dfv_1.dfv.setData(target, "sql.tableName", "", name);
            else
                dfv_1.dfv.setData(target, "sql.tableName", "", name.name);
        };
    }
    static getTableName(table) {
        return dfv_1.dfv.getData(table, "sql.tableName", "");
    }
    /**
     * 将变量与函数体转换为浏览器可调用的字符串
     * @param vari 传递的变量
     * @param func 函数
     */
    static scriptVar(vari, func) {
        if (vari == null) {
            return `<script>(function(){${dfv_1.dfv.getFuncBody(func)}})();</script>`;
        }
        let name = dfv_1.dfv.getFuncBody(vari);
        let val = vari();
        if (typeof val === "object")
            return `<script>(function(){var ${name}=${JSON.stringify(val)};${dfv_1.dfv.getFuncBody(func)}})();</script>`;
        else
            return `<script>(function(){var ${name}=${sql.filter(val)};${dfv_1.dfv.getFuncBody(func)}})();</script>`;
    }
}
exports.sql = sql;
//# sourceMappingURL=sql.js.map