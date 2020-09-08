import { SqlTableField } from "./SqlTableField";
import { SqlTableInfo, TableObject } from "./SqlTableInfo";
import { ISqlConnecter } from "./ISqlConnecter";
import { ArrayCache, sql } from "../public/sql";
import { ISqlSelectField, SelectOrderType } from "./ISqlField";

export interface ISqlSelectFieldBuilder<T> extends ISqlSelectField<T> {
    /**
     * in 条件
     * @param val 可以是单个值,或number数组,或SqlBuilder子查询
     */
    in(val: ISqlSelectFieldBuilder<any> | T | T[] | SqlBuilder<any>): any;

    /**
     * not in 条件
     * @param val 可以是单个值,或number数组,或SqlBuilder子查询
     */
    notIn(val: ISqlSelectFieldBuilder<any> | T | T[] | SqlBuilder<any>): any;
}

export type SelectFieldTypeBuilder<T> = {
    [P in keyof T]: ISqlSelectFieldBuilder<T[P]> & number
};

export class SqlBuilder<TC, SubT = TC> {

    /**
     * 所有表的缓存
     */
    static cacheMap = new Map<string, Map<string | number | null | undefined, any[]>>();

    /**
     * sql语句拼接结果
     * @type {string}
     */
    private sqlStr = "";
    private whereStr = "";
    private orderStr = "";
    private groupByStr = "";
    private limitStr: string | undefined;
    private selectStr: string | undefined;
    private setStr: string | undefined;

    /**
     * 表名
     */
    private tableName: string = "";

    /**
     *
     * @param className 表model class
     * @param sqlCon 数据库链接对象
     * @param tableName 可选,额外指定表名(连表操作等...)
     */
    constructor(private className: { new(): TC; }, public sqlCon: ISqlConnecter, tableName?: string
        | { new(): any; }
        | SqlBuilder<any>
        | ISqlJoin) {

        if (this.metaTableInfo() == null) {
            this.setMetaTableInfo(new SqlTableInfo(className))
        }

        if (tableName) {
            if (typeof tableName === "string")
                this.tableName = tableName;
            else if (tableName instanceof SqlBuilder) {
                this.tableName = tableName.whereStr
            }
            else
                this.tableName = (tableName as any).name;
        } else {
            this.tableName = this.metaTableInfo().tableName;
        }

    }

    getTableName() {
        return this.tableName;
    }


    /**
     * 事务链接
     * @param {ISqlConnecter} con
     */
    transaction(con: ISqlConnecter): this {
        this.sqlCon = con;
        return this;
    }

    /**
     * 表元信息
     * @returns {SqlTableInfo}
     */
    private metaTableInfo() {
        return (this.className as any)._tableInfo_ as SqlTableInfo<TC>;
    }

    private setMetaTableInfo(table: SqlTableInfo<TC>) {
        (this.className as any)._tableInfo_ = table;
    }

    private getCacheTable() {
        return this.sqlCon.getConnectName() + this.tableName;
    }

    private getTableCacheMap() {
        let map = (this.metaTableInfo() as any)[this.getCacheTable()] as Map<string | number | null | undefined, SubT[]>;
        if (!map) {
            map = new Map<string | number | null | undefined, SubT[]>();
            (this.metaTableInfo() as any)[this.getCacheTable()] = map;
            SqlBuilder.cacheMap.set(this.getCacheTable(), map);
        }

        return map;
    }

    /**
     * 清除所有表的缓存
     */
    static clearAllCache() {
        for (var m of SqlBuilder.cacheMap) {
            var k = m[0];
            var v = m[1];
            v.clear();
        }
    }

    /**
     * 复制所有条件
     * @param name 表名
     * @returns {SqlBuilder<TC>}
     */
    copyTo(name?: string): SqlBuilder<TC> {
        let m = new SqlBuilder<TC>(this.className, this.sqlCon, name);
        m.sqlStr = this.sqlStr
        m.whereStr = this.whereStr
        m.limitStr = this.limitStr
        m.orderStr = this.orderStr
        m.groupByStr = this.groupByStr
        m.selectStr = this.selectStr
        m.setStr = this.setStr
        return m;
    }


    /**
     * 从缓存中获取cacheId为字串类型
     * @param id
     */
    cacheGetString(id: string): Promise<SubT[]> {
        return this.cacheGet(id + "");
    }

    /**
     * 从缓存中获取cacheId为整数类型
     * @param id
     */
    cacheGetInt(id: number): Promise<SubT[]> {
        return this.cacheGet(parseInt(id as any));
    }

    /**
     * 从缓存中获取cacheId为浮点类型
     * @param id
     */
    cacheGetFloat(id: number): Promise<SubT[]> {
        return this.cacheGet(parseFloat(id as any));
    }

    /**
     * 从缓存中获取,无cacheId
     * @returns {Promise<SubT[]>}
     */
    cacheGetNull(): Promise<SubT[]> {
        return this.cacheGet(null);
    }

    /**
    * 设置缓存结果排序
    */
    setCacheSort(func: (l: SubT, r: SubT) => number): this {
        this.cacheSort = func;
        return this;
    }

    private cacheSort?: (l: SubT, r: SubT) => number;


    /**
     * 从缓存中获取cacheId或cacheWhere的数据
     * @param id
     */
    private cacheGet(id: string | number | null): Promise<SubT[]> {
        return new Promise((reso, reject) => {
            let cacheMap = this.getTableCacheMap();
            let list = cacheMap.get(id);
            if (list) {
                (list as ArrayCache).__ReadCount = (list as ArrayCache).__ReadCount! + 1;
                reso(list);
                return;
            }


            if (this.metaTableInfo().cacheId) {
                this.whereStr = " " + this.metaTableInfo().cacheId + "=" + sql.filter(id);
            }
            else if (this.metaTableInfo().cacheWhere) {
                this.whereStr = this.metaTableInfo().cacheWhere!(id) as string;
            }
            else {
                reject(Error("没有指定sql.cacheId字段或cacheWhere"))
                return;
            }


            this.toArray().then(res => {
                //缓存已满,
                if (cacheMap.size >= this.sqlCon.getMaxCache()) {
                    SqlBuilder.clearCache(cacheMap);
                }

                (res as ArrayCache).__ReadCount = 0;
                if (this.cacheSort)
                    res!.sort(this.cacheSort);

                cacheMap.set(id, res)
                reso(res);
            }).catch(err => {
                reject(err);
            })

        })
    }


    static onCacheRemove(table: string, id: string | number | null) {

    }

    /**
     * 从缓存中移除cacheId的数据
     * @param id
     */
    cacheRemove(id: string | number | null) {
        this.getTableCacheMap().delete(id);
        // if (InnerRpc.servers.length > 1) {
        //     for (let s of InnerRpc.servers) {
        //         let host = RpcServer.getHostName(s);
        //         if (RpcClass.hostName[host])
        //             continue;
        //         RpcServer.inner(s).delMysql(this.getCacheTable(), id);
        //     }
        // }
        SqlBuilder.onCacheRemove(this.getCacheTable(), id)
    }

    /**
     * 移除所有
     */
    cacheRemoveAll() {
        this.getTableCacheMap().clear();
    }

    /**
     * 移除前10个中__ReadCount最小的
     * @param cacheMap
     */
    static clearCache(cacheMap: Map<string | number | null | undefined, any[]>) {
        let i = 0;
        let minK: any = null;
        let minCount: number | null | undefined = null;

        for (var item of cacheMap) {
            var k = item[0];
            var v = item[1];
            if (minCount == null) {
                minCount = (v as ArrayCache).__ReadCount;
                minK = k;
            }
            else if ((v as ArrayCache).__ReadCount! < minCount) {
                minCount = (v as ArrayCache).__ReadCount;
                minK = k;
            }

            if ((v as ArrayCache).__ReadCount == 0)
                break;

            if (i > 10)
                break;
            i++;
        }

        if (minK != null) {
            cacheMap.delete(minK);
        }
    }


    /**
     * 记录多表链接的对象
     */
    private joinObjs: Array<SqlTableInfo<any>> | undefined

    private makeJoin<T1>(right: { new(): T1; },
        func: (l: SelectFieldTypeBuilder<TC> & TC, r: SelectFieldTypeBuilder<T1> & T1) => any,
        where: string) {

        // if (!this.joinObjs)
        //     this.joinObjs = [this.metaTableInfo()];

        // let build = new SqlBuilder(right, this.sqlCon);

        // this.joinObjs.push(build.metaTableInfo())

        // this.joinObjs.forEach(it => it.tableNamePrefix = true);

        // this.makeFuncs(func, this.joinObjs);

        // this.joinObjs.forEach(it => it.tableNamePrefix = false);

        // if (this.whereStr.length == 0) {
        //     this.whereStr = this.tableName
        // }

        // this.whereStr += where + build.getTableName() + " on " + SqlTableField.makeWhere(func, this.valList);
    }

    /**
     *  连表查询
     * @param right join的表名
     * @param func on 条件表达式
     * @returns {SqlBuilder}
     */
    innerJoin<T1>(right: { new(): T1; }, func: (l: SelectFieldTypeBuilder<TC>, r: SelectFieldTypeBuilder<T1>
        & T1) => any): SqlJoin3<TC, T1> {
        this.makeJoin(right, func, " inner join ");
        return this as any;
    }

    /**
     * 左链接
     * @param right
     * @param func
     * @returns {SqlBuilder}
     */
    leftJoin<T1>(right: { new(): T1; }, func: (l: SelectFieldTypeBuilder<TC> & TC, r: SelectFieldTypeBuilder<T1>
        & T1) => any): SqlJoin3<TC, T1> {
        this.makeJoin(right, func, " left join ");
        return this as any;
    }

    /**
     *  连表查询
     * @param right join的表名
     * @param func on 条件表达式
     * @returns {SqlBuilder} 用于SqlBuilder构造函数的tableName
     */
    rightJoin<T1>(right: { new(): T1; }, func: (l: SelectFieldTypeBuilder<TC> & TC, r: SelectFieldTypeBuilder<T1>
        & T1) => any): SqlJoin3<TC, T1> {
        this.makeJoin(right, func, " right join ");
        return this as any;
    }


    private addCondition() {
        if (this.whereStr.length > 0) {
            this.sqlStr += " where " + this.whereStr;
            // this.whereStr = "";
        }

        if (this.groupByStr.length > 0) {
            this.sqlStr += " group by " + this.groupByStr;
            this.groupByStr = "";
        }

        if (this.orderStr.length > 0) {
            this.sqlStr += " order by " + this.orderStr;
            this.orderStr = "";
        }

        if (this.limitStr) {
            this.sqlStr += this.limitStr;
            this.limitStr = undefined;
        }
    }

    /**
     * 生成select语句
     * @returns {string}
     */
    getSelectSql(): string {
        this.sqlStr = "select ";

        if (this.selectStr) {
            this.sqlStr += this.selectStr;
            this.selectStr = undefined;
        }
        else {
            this.sqlStr += this.metaTableInfo().fieldsStr
        }

        this.sqlStr += " from " + this.tableName;

        this.addCondition();

        return this.sqlStr;
    }

    /**
     * 生成sql语句值列表
     * @param func 单参数lambda
     */
    protected makeFunc(func: (f: TableObject<TC>) => any, comma = false): string {
        return this.metaTableInfo().makeFunc(func, comma);
    }



    toString() {
        return this.sqlStr;
    }

    /**
     * 重置where条件
     * @param func 条件lambda表达式
     * @returns {SqlBuilder}
     */
    where(func: (f: TableObject<TC>) => any): SqlBuilder<TC, SubT> {
        this.whereStr = this.makeFunc(func);
        return this;
    }

    /**
     * 给where添加and条件
     * @param func 条件lambda表达式
     * @returns {SqlBuilder}
     */
    and(func: (f: TableObject<TC>) => any): SqlBuilder<TC, SubT> {
        if (this.whereStr.length > 0)
            this.whereStr += " and ";
        this.whereStr += this.makeFunc(func);
        return this;
    }

    /**
     * 给where添加or条件
     * @param func 条件lambda表达式
     * @returns {SqlBuilder}
     */
    or(func: (f: TableObject<TC>) => any): SqlBuilder<TC, SubT> {
        if (this.whereStr.length > 0)
            this.whereStr += " or ";
        this.whereStr += this.makeFunc(func);
        return this;
    }

    /**
     * 指定select字段
     * @param func 字段表达式
     */
    select<FieldT extends keyof TC>(...fields: FieldT[]): SqlBuilder<TC, Pick<TC, FieldT>> {
        this.selectStr = "";
        for (let k of fields) {
            if (this.selectStr.length > 0)
                this.selectStr += ",";
            this.selectStr += this.metaTableInfo().getField(k).getFieldName()
        }
        return this as SqlBuilder<TC, any>;
    }

    /**
     * select指定as别名
     * @param func
     */
    selectAs<T>(func: (f: TableObject<TC>) => T): SqlBuilder<TC, T> {
        let ret = func(this.metaTableInfo().classObj);
        let str = "";
        for (let k in ret) {
            let v = ret[k];
            str += SqlTableField.getValue(v) + " as `" + k + "`,";
        }
        this.selectStr = str.removeLast();

        return this as SqlBuilder<TC, any>;
    }

    /**
     * 排除指定select字段
     * @param func
     * @returns {SqlBuilder}
     */
    unselect<FieldT extends keyof TC>(...fields: FieldT[]): SqlBuilder<TC, Omit<TC, FieldT>> {
        var fMap: { [key: string]: boolean } = {};
        for (let it of fields) {
            fMap[it as string] = true
        }

        this.selectStr = " ";
        this.metaTableInfo().fieldList.forEach(f => {
            if (!fMap[f.fieldName]) {
                this.selectStr += f.getFieldName() + ","
            }
        });
        this.selectStr = this.selectStr.removeLast();
        return this as SqlBuilder<TC, any>;
    }

    /**
     * 添加order by条件
     * @param func 字段表达式
     */
    order(func: (f: TableObject<TC>) => any): SqlBuilder<TC, SubT> {
        if (this.orderStr.length > 0)
            this.orderStr += ",";
        this.orderStr += this.makeFunc(func, true);
        return this;
    }

    /**
     * 添加groupBy lmabda条件
     * @param func 字段表达式
     */
    group(func: (f: TableObject<TC>) => any): SqlBuilder<TC, SubT> {
        if (this.groupByStr.length > 0)
            this.groupByStr += ",";

        this.groupByStr += this.makeFunc(func, true);
        return this;
    }

    /**
     * 添加groupBy 字段集合
     * @param fields 字段集合
     */
    groupBy<FieldT extends keyof TC>(...fields: FieldT[]): SqlBuilder<TC, SubT> {
        for (let k of fields) {
            if (this.groupByStr.length > 0)
                this.groupByStr += ",";
            this.groupByStr += this.metaTableInfo().getField(k).getFieldName()
        }
        return this;
    }


    /**
     * limit
     * @param start 起始偏移位置,不传第二count参数则表示个数
     * @param count 个数
     * @returns {SqlBuilder}
     */
    limit(start: number, count?: number): SqlBuilder<TC, SubT> {
        if (count == null)
            this.limitStr = " limit " + start;
        else
            this.limitStr = " limit " + start + ',' + count;

        return this;
    }

    /**
     * 添加update条件
     * @param func 条件表达式
     * @returns {SqlBuilder}
     */
    set(func: (f: TableObject<TC>) => any): SqlBuilder<TC, SubT> {
        if (this.setStr)
            this.setStr += ",";
        else
            this.setStr = "";
        this.setStr += this.makeFunc(func, true);
        return this;
    }

    /**
     * 通过表达式更新
     * @param func set表达式
     * @returns {Promise<T>}  影响行数,失败抛reject异常
     */
    update(func?: (f: TableObject<TC>) => any): Promise<number> {
        return new Promise((resolve, reject) => {
            this.getUpdate(func)
            this.sqlCon.update(this.sqlStr, (err, res) => {
                if (err)
                    reject(err);
                else
                    resolve(res.affectCount);
            });
        });
    }

    private getUpdate(func?: (f: TableObject<TC>) => any) {
        this.sqlStr = "update " + this.tableName + " set "
        if (this.setStr)
            this.sqlStr += this.setStr;

        if (func) {
            if (this.setStr)
                this.sqlStr += ",";
            this.sqlStr += this.makeFunc(func, true);
        }

        this.addCondition();
    }

    /**
     *  根据主键id更新整个对象(会忽略where条件)
     * @param field 更新的对象
     * @returns {Promise<number>} 影响行数,失败抛reject异常
     */
    updateById(field: TC): Promise<number> {

        return new Promise((resolve, reject) => {

            this.sqlStr = "update " + this.tableName + " set ";

            for (let key in field) {
                if (key === this.metaTableInfo().primaryKeyName)
                    continue;
                let fieldKey = this.metaTableInfo().getField(key).getFieldName();
                this.sqlStr += fieldKey + "=" + SqlTableField.getValue(field[key]) + ",";
            }
            this.sqlStr = this.sqlStr.removeLast();

            this.sqlStr += " where "
                + this.metaTableInfo().getPriKeyFieldName() + "="
                + SqlTableField.getValue((field as any)[this.metaTableInfo().primaryKeyName]);

            this.sqlCon.update(this.sqlStr, (err, res) => {
                if (err)
                    reject(err);
                else
                    resolve(res.affectCount)
            });

        });
    }


    /**
     * 获取单行一个对象(limit 1)
     * @returns {Promise<T>} 结果对象,或者null,失败抛reject异常
     */
    toOne(): Promise<SubT | null> {
        return new Promise<any>((resolve, reject) => {

            this.limit(1);
            this.getSelectSql();
            this.sqlCon.query(this.sqlStr, (err, data) => {
                if (err) {
                    reject(err);
                }
                else if (data && data.length > 0) {
                    data = data[0];
                    Object.setPrototypeOf(data, this.className.prototype)
                    resolve(data);
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * 获取多个结果
     * @returns {Promise<T>} 对象数组,失败抛reject异常
     */
    toArray(): Promise<SubT[]> {
        return new Promise((resolve, reject) => {
            this.getSelectSql();
            this.sqlCon.query(this.sqlStr, (err, data) => {
                if (err)
                    reject(err);
                else {
                    if (!data)
                        data = [];
                    else
                        data.forEach(it => Object.setPrototypeOf(it, this.className.prototype))
                    resolve(data);
                }

            });
        });
    }

    /**
     * 获取大量select结果
     * @param eachFunc
     * @returns {Promise<void>}
     */
    forEach(eachFunc: (row: SubT) => void | Promise<void>): Promise<void> {
        this.getSelectSql();
        return this.sqlCon.queryEach(this.sqlStr, (row) => {
            Object.setPrototypeOf(row, this.className.prototype)
            return eachFunc(row);
        })
    }

    private insertValue(field: TC, autoInc = true) {
        this.sqlStr += "( ";
        if (autoInc) {
            for (let key in field) {
                if (this.metaTableInfo().autoIncrementMap[key])
                    this.sqlStr += "null,"
                else
                    this.sqlStr += SqlTableField.getValue(field[key]) + ",";
            }
        }
        else {
            for (let key in field) {
                this.sqlStr += SqlTableField.getValue(field[key]) + ",";
            }
        }


        this.sqlStr = this.sqlStr.removeLast();

        this.sqlStr += "),";
    }


    private initInsertSql(field: TC) {
        this.sqlStr = "insert into " + this.tableName + "( "
        for (let key in field) {
            this.sqlStr += this.metaTableInfo().getField(key).getFieldName() + ",";
        }
        this.sqlStr = this.sqlStr.removeLast() + ") values";
    }


    /**
     * insert,当添加单个对象会将自增长主键值自动填充回field对象
     * @param field 单个对象,或对象数组
     * @param autoInc 是否忽略autoIncrement字段的值
     * @returns {Promise<T>} 影响行数,失败抛reject异常
     */
    insert(field: TC | TC[], autoInc = true): Promise<number> {
        return new Promise((resolve, reject) => {
            if (field == null) {
                resolve(0);
                return;
            }

            if (Array.isArray(field)) {
                if (field.length < 1) {
                    resolve(0);
                    return;
                }
                this.initInsertSql(field[0]);
                (field as TC[]).forEach(it => this.insertValue(it, autoInc));
            }
            else {
                this.initInsertSql(field);
                this.insertValue(field);

            }
            this.sqlStr = this.sqlStr.removeLast();

            this.sqlCon.update(this.sqlStr, (err, r) => {
                if (r.insertId && !Array.isArray(field)) {
                    (field as any)[this.metaTableInfo().primaryKeyName] = r.insertId;
                }

                if (err)
                    reject(err);
                else
                    resolve(r.affectCount);
            });
        });
    }


    /**
     * 在已有的条件上执行delete
     * @returns {Promise<T>} 影响行数,失败抛reject异常
     */
    delete(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.sqlStr = "delete from " + this.tableName;
            this.addCondition();
            this.sqlCon.update(this.sqlStr, (err, res) => {
                if (err)
                    reject(err);
                else
                    resolve(res.affectCount);
            });
        });
    }


    /**
     * 在已有的条件上执行select count(*)
     * @returns {Promise<T>} 结果个数,失败抛reject异常
     */
    count(): Promise<number> {
        return new Promise((resolve, reject) => {

            this.sqlStr = "select count(*) from " + this.tableName;

            this.addCondition();

            this.sqlCon.query(this.sqlStr, (err, data) => {
                let count = 0;
                if (data && data.length > 0)
                    count = parseInt(data[0]["count(*)"]) as any;

                if (err)
                    reject(err);
                else
                    resolve(count)
            });
        });
    }


    /**
     * 获取任意类型结果集(用于自定义select字段)
     * @returns {Promise<T>} 仿二维数组类型结果集([行][列]),失败抛reject异常
     */
    getAny(): Promise<any[]> {
        return new Promise((resolve, reject) => {

            this.getSelectSql();
            this.sqlCon.query(this.sqlStr, (err, data) => {
                if (!data) {
                    data = [];
                }
                else if (data.length > 0) {
                    let fields = Object.keys(data[0]);

                    for (let i = 0; i < data.length; i++) {
                        fields.forEach((v, ii) => {
                            data![i][ii] = data![i][v];
                        });
                    }
                }
                if (err)
                    reject(err);
                else
                    resolve(data);
            });


        });
    }

}


export interface ISqlJoin {
}

export interface SqlJoin3<T1, T2> extends ISqlJoin {

    innerJoin<T3>(right: { new(): T3; }, func: (p1: SelectFieldTypeBuilder<T1>, p2: SelectFieldTypeBuilder<T2> & T2, p3: SelectFieldTypeBuilder<T3>
        & T3) => any): SqlJoin4<T1, T2, T3>;

    leftJoin<T3>(right: { new(): T3; }, func: (p1: SelectFieldTypeBuilder<T1>, p2: SelectFieldTypeBuilder<T2> & T2, p3: SelectFieldTypeBuilder<T3>
        & T3) => any): SqlJoin4<T1, T2, T3>;

    rightJoin<T3>(right: { new(): T3; }, func: (p1: SelectFieldTypeBuilder<T1>, p2: SelectFieldTypeBuilder<T2> & T2, p3: SelectFieldTypeBuilder<T3>
        & T3) => any): SqlJoin4<T1, T2, T3>;
}

export interface SqlJoin4<T1, T2, T3> extends ISqlJoin {

    innerJoin<T4>(right: { new(): T4; }, func: (p1: SelectFieldTypeBuilder<T1>, p2: SelectFieldTypeBuilder<T2> & T2, p3: SelectFieldTypeBuilder<T3>
        & T3, p4: SelectFieldTypeBuilder<T4>) => any): ISqlJoin;

    leftJoin<T4>(right: { new(): T4; }, func: (p1: SelectFieldTypeBuilder<T1>, p2: SelectFieldTypeBuilder<T2> & T2, p3: SelectFieldTypeBuilder<T3>
        & T3, p4: SelectFieldTypeBuilder<T4>) => any): ISqlJoin;

    rightJoin<T4>(right: { new(): T4; }, func: (p1: SelectFieldTypeBuilder<T1>, p2: SelectFieldTypeBuilder<T2> & T2, p3: SelectFieldTypeBuilder<T3>
        & T3, p4: SelectFieldTypeBuilder<T4>) => any): ISqlJoin;
}