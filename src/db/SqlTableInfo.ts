import {SqlTableField} from "./SqlTableField";
import {MapString} from "../public/dfv";
import {sql} from "../public/sql";


export class SqlTableInfo {

    /**
     * 字段列表,号分隔
     * @type {string}
     */
    fieldsStr = "";
    fieldList: SqlTableField[] = [];

    /**
     * 主键索引
     * @type {number}
     */
    pkIndex = -1;

    primaryKeyName = "";


    /**
     * b保存非别名自增长字段
     * @type {{}}
     */
    autoIncrementMap: MapString<Boolean> = {};

    tableName = "";

    /**
     * 生成sql语句中的值列表
     * @type {Array}
     */
    valList: string[] = [];

    //
    classObj: any;

    /**
     * 表达式中的字段是否附加表名前缀
     * @type {boolean}
     */
    tableNamePrefix: boolean = false;

    cacheId = "";

    cacheWhere: ((id: string | number | null) => string | Object) | null = null;


    /**
     * 获取指定键的字段信息
     * @param key
     * @returns {SqlTableField}
     */
    getField(key: string) {
        return this.classObj[key] as SqlTableField
    }

    constructor(public className: { new(): any; }) {

        let i = 0;

        this.classObj = new className();
        sql.setTableInfo(this.classObj);
        this.primaryKeyName = sql.getPrimaryKey(className);

        this.tableName = sql.getTableName(className);
        if (!this.tableName)
            this.tableName = className.name;

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

            let fi = new SqlTableField(field,
                sql.getFieldName(this.className, field),
                sql.getFieldTable(this.className, field),
                this);

            this.fieldsStr += fi.getFieldAsName() + ",";
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