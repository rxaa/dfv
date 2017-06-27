import {MongoField} from "./MongoField";
import {array} from "../public/dfv";
import {sql} from "../public/sql";
export class MongoTable {
    /**
     * 所有表的缓存
     */
    static cacheMap = new Map<string,Map<string|number|null|undefined,any[]>>();

    static allTable = array(MongoTable);

    //字段列表,号分隔
    fieldsStr = "";
    fieldList: string[] = [];

    tableName = "";

    //生成sql语句中的值列表
    valList: any[] = [];

    update_: any = {};

    /**
     * 索引列表
     */
    index_: any[] = [];

    //
    classObj: any;

    /**
     * 表达式中的字段是否附加表名前缀
     * @type {boolean}
     */
    tableNamePrefix: boolean = false;

    cacheId = "";

    cacheWhere: ((id: string|number)=>string|Object)|null = null;

    constructor(public className: { new(): any ;}) {


        this.classObj = new className();
        this.tableName = sql.getTableName(className);

        if (!this.tableName)
            this.tableName = className.name;

        this.cacheId = sql.getCacheId(className);

        this.cacheWhere = sql.getCacheWhere(className);
        if (this.cacheId && this.cacheWhere) {
            throw Error("cacheId或cacheWhere只能有一个")
        }

        let i = 0;
        for (let f in this.classObj) {
            if (this.classObj[f] instanceof Function) {
                continue;
            }


            let fieldName = this.getFieldName(f);
            this.fieldsStr += fieldName + ",";
            this.fieldList.push(fieldName);

            MongoTable.addIndex(className, f, this.index_);

            this.classObj[f] = MongoField.newField(fieldName, this, this.classObj[f]);

            i++;
        }

        this.classObj.$unset = (val: any) => {
            if (!this.update_["$unset"]) {
                this.update_["$unset"] = {};
            }
            this.update_["$unset"][val] = 1;
        }

        this.fieldsStr = this.fieldsStr.removeLast();

        MongoTable.allTable.push(this);
    }


    /**
     * 添加索引
     * @param className 类名
     * @param f 字段名
     * @param indexArr 输出结果
     */
    static addIndex(className: { new(): any ;}, f: string, indexArr: any[]) {
        let index = sql.getIndex(className, f);
        if (index != null) {
            if (typeof index === "number" || typeof index === "string") {
                let newI:any = {};
                newI[f] = index;
                indexArr.push(newI);
            }
            else {
                indexArr.push(index);
            }
        }
    }

    /**
     * 创建所有索引
     * @param con
     */
    // static createAllIndex(con:MongoConnect) {
    //     con.connect((err, db)=> {
    //         if (err) {
    //             Log.err(err);
    //             return;
    //         }
    //
    //         MongoTable.allTable.forEach(it=> {
    //             if (it.index_.length > 0) {
    //                 it.index_.forEach(ind=> {
    //                     db.createIndex(it.tableName, ind, (err, res)=> {
    //                         if (err) {
    //                             Log.err(err);
    //                             return;
    //                         }
    //                     })
    //                 })
    //             }
    //         })
    //     });
    //
    // }

    getFieldName(str: string): string {
        let name = sql.getFieldName(this.className, str);
        if (name)
            return name;

        return str;
    }


}