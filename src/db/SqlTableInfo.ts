import { SqlTableField } from "./SqlTableField";
import { MapString } from "../public/dfv";
import { sql } from "../public/sql";


export type TableObject<T> = {
    [P in keyof T]: SqlTableField<T[P], T>
};

export class SqlTableInfo<ClassT> {



    /**
     * 字段列表,号分隔
     * @type {string}
     */
    fieldsStr = "";

    fieldList: SqlTableField<any, ClassT>[] = [];

    /**
     * 主键索引
     * @type {number}
     */
    pkIndex = -1;

    //主键字段(object中的属性名)
    primaryKeyName = "";

    getPriKeyFieldName() {
        return this.fieldList[this.pkIndex].getFieldName();
    }

    /**
     * b保存非别名自增长字段
     * @type {{}}
     */
    autoIncrementMap: MapString<Boolean> = {};

    tableName = "";

    //原始对象转为SqlTableField对象
    classObj: TableObject<ClassT>;

    /**
     * 表达式中的字段是否附加表名前缀
     * @type {boolean}
     */
    tableNamePrefix: boolean = false;

    cacheId = "";

    sqlStr = ""

    commaPrefix = false;

    cacheWhere: ((id: string | number | null) => string | Object) | null = null;


    /**
    * 生成sql语句值列表
    * @param func 单参数lambda
    */
    makeFunc(func: (f: TableObject<ClassT>) => any, comma = false): string {
        let old = this.sqlStr;
        let oldComma = this.commaPrefix;
        this.sqlStr = "";
        this.commaPrefix = comma;
        let ret = func(this.classObj)
        if (this.sqlStr.length == 0 && ret) {
            if (ret instanceof SqlTableField) {
                this.sqlStr += ret.toString();
            }
            else if (ret instanceof sql) {
                this.sqlStr += (ret as sql).func();
            }
        }
        let retSql = this.sqlStr;
        this.sqlStr = old;
        this.commaPrefix = oldComma;
        return retSql;
    }

    /**
     * 获取指定键的字段信息
     * @param key
     * @returns {SqlTableField}
     */
    getField(key: string | keyof ClassT) {
        return (this.classObj as any)[key] as SqlTableField<any, ClassT>
    }

    constructor(public className: { new(): any; }) {

        let i = 0;

        this.classObj = new className();
        sql.setTableInfo(this.classObj);
        this.primaryKeyName = sql.getPrimaryKey(className);

        this.tableName = sql.getTableName(className);
        if (!this.tableName)
            this.tableName = className.name;
        this.tableName = "`" + this.tableName + "`";
        let tableName = this.tableName;

        this.classObj.toString = function () {
            return tableName;
        }

        this.cacheId = sql.getCacheId(className);

        this.cacheWhere = sql.getCacheWhere(className);
        if (this.cacheId && this.cacheWhere) {
            throw Error("cacheId或cacheWhere只能有一个")
        }
        for (let field in this.classObj) {
            if (this.classObj[field] instanceof Function) {
                continue;
            }
            if (sql.getAutoIncrement(className, field)) {
                this.autoIncrementMap[field] = true;
            }

            let rawName = sql.getFieldName(this.className, field);
            let fi = new SqlTableField(
                this.classObj,
                field,
                rawName ? rawName : field,
                sql.getFieldTable(this.className, field),
                this);

            this.fieldsStr += (rawName ? fi.getFieldAsName() : fi.getFieldName()) + ",";
            this.fieldList.push(fi);
            this.classObj[field] = fi;

            sql.setTableInfo(this.classObj[field]);
            if (field === this.primaryKeyName)
                this.pkIndex = i;


            i++;
        }

        this.fieldsStr = this.fieldsStr.removeLast();
    }


}