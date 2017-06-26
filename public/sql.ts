import {dfv} from "./dfv";
export interface ArrayCache {
    __ReadCount?: number;
}

export interface MongoIndex {
    // Creates an unique index.
    unique?: boolean;
    // Creates a sparse index.
    sparse?: boolean;
    // Creates the index in the background, yielding whenever possible.
    background?: boolean;
    // A unique index cannot be created on a key that has pre-existing duplicate values.
    // If you would like to create the index anyway, keeping the first document the database indexes and
    // deleting all subsequent documents that have duplicate value
    dropDups?: boolean;
    // For geo spatial indexes set the lower bound for the co-ordinates.
    min?: number;
    // For geo spatial indexes set the high bound for the co-ordinates.
    max?: number;
    // Specify the format version of the indexes.
    v?: number;
    // Allows you to expire data on indexes applied to a data (MongoDB 2.2 or higher)
    expireAfterSeconds?: number;
    // Override the auto generated index name (useful if the resulting name is larger than 128 bytes)
    name?: string;
}


export class sql {
    constructor(public func: () => string) {

    }

    /**
     * sql值转义
     * @param val
     * @returns
     */
    static filter(val: any): string {
        if (val == null)
            return "NULL";

            if (typeof val === "number")
                return val + '';

            var ret = "'";
            var str = val.toString();
            for (var i = 0; i < str.length; i++) {
                var s = str.charAt(i);
                if (s == "\\") {
                    ret += "\\\\"
                }
                else if (s == "'") {
                    ret += "\\'"
                }
                else {
                    ret += s;
                }
        }
        return ret + "'";
    }

    static setTableInfo(obj: any) {
        Object.defineProperty(obj, "__tableInfo_", {
            value: true,
            enumerable: false,
            writable: true,
        });
    }

    static isTableInfo(obj: any): boolean {
        return obj && obj.__tableInfo_
    }

    /**
     * 不做escape处理字串
     * @returns {any}
     * @param template
     * @param substitutions
     */
    static src(template: TemplateStringsArray, ...substitutions: any[]): any {
        return <any>new sql(() => {
            var ret = ""
            var i = 0
            for (; i < substitutions.length; i++) {
                ret += template[i];
                var val = substitutions[i];
                if (sql.isTableInfo(val))
                    ret += val;
                else
                    ret += sql.filter(val);
            }
            if (i < template.length) {
                ret += template[i]
            }
            return ret;
        });
    }

    /**
     * now函数
     * @returns {any}
     */
    static now(): Date {
        return <any>new sql(() => {
            return "now()";
        });
    }


    static primaryKey(target: Object, propertyKey: string) {
        dfv.setData(target.constructor, "sql.primaryKey", "", propertyKey);
        // (target.constructor as ModMetaData)._primaryKeyName_ = propertyKey;
    }

    static getPrimaryKey(table: { new(): any; }) {
        return dfv.getData(table, "sql.primaryKey", "") as string;
    }

    static autoIncrement(target: Object, propertyKey: string) {
        dfv.setData(target.constructor, "sql.autoIncrement", propertyKey, true);
        // (target.constructor as ModMetaData)._primaryKeyName_ = propertyKey;
    }

    static getAutoIncrement(table: { new(): any; }, propertyKey: string) {
        return dfv.getData(table, "sql.autoIncrement", propertyKey) as boolean;
    }

    /**
     * 全文索引
     * @param options
     */
    static indexText(options?: MongoIndex) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "sql.index", propertyKey, "text");
        }
    }

    /**
     * 正序索引
     * @param options
     */
    static index(options?: MongoIndex) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "sql.index", propertyKey, 1);
        }
    }

    /**
     * 倒序索引
     * @param options
     */
    static indexDesc(options?: MongoIndex) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "sql.index", propertyKey, -1);
        }
    }

    /**
     * 原始格式索引数据,例如组合索引{field:1,field2:-1}
     * @param obj
     * @param options
     */
    static indexRaw(obj: Object, options?: MongoIndex) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "sql.index", propertyKey, obj);
        }
    }

    static getIndex(table: { new(): any; }, field: string) {
        return dfv.getData(table, "sql.index", field) as number | Object;
    }


    /**
     * 指定sql对象缓存的查询id
     * @param target
     * @param propertyKey
     */
    static cacheId(target: Object, propertyKey: string) {
        dfv.setData(target.constructor, "sql.cacheId", "", propertyKey);
        // (target.constructor as ModMetaData)._primaryKeyName_ = propertyKey;
    }

    static getCacheId(table: { new(): any; }) {
        return dfv.getData(table, "sql.cacheId", "") as string;
    }

    static cacheWhere<T>(func: (id: string | number | null) => string | Object) {
        return ((target: { new(): T; }) => {
            dfv.setData(target, "sql.cacheWhere", "", func);
        });
    }

    static getCacheWhere(table: { new(): any; }) {
        return dfv.getData(table, "sql.cacheWhere", "") as (id: string | number) => string | Object;
    }

    /**
     * 指定字段为别名
     * @param name 字段在数据库中的实际名称
     * @returns {function(Object, string): undefined}
     */
    static fieldName(name: string) {
        return (target: Object, propertyKey: string) => {
            dfv.setData(target.constructor, "sql.fieldName", propertyKey, name);
        }
    }

    static getFieldName(table: { new(): any; }, field: string) {
        return dfv.getData(table, "sql.fieldName", field) as string;
    }

    /**
     * 指定字段所属表
     * @param name
     * @returns {(target:Object, propertyKey:string)=>undefined}
     */
    static fieldTable(name: string | { new(): any; }) {
        return (target: Object, propertyKey: string) => {
            if (typeof name === "string") {
                dfv.setData(target.constructor, "sql.fieldTable", propertyKey, name);
            }
            else {
                dfv.setData(target.constructor, "sql.fieldTable", propertyKey, (name as any).name);
            }
        }
    }

    static getFieldTable(table: { new(): any; }, field: string) {
        return dfv.getData(table, "sql.fieldTable", field) as string;
    }


    /**
     * 指定表别名
     * @param name 字串或表class
     * @returns {function({new(): any}): undefined}
     */
    static tableName(name: string | { new(): any; }) {
        return (target: { new(): any; }) => {
            if (typeof name === "string")
                dfv.setData(target, "sql.tableName", "", name);
            else
                dfv.setData(target, "sql.tableName", "", (name as any).name);
        }
    }

    static getTableName(table: { new(): any; }) {
        return dfv.getData(table, "sql.tableName", "") as string;
    }

}
