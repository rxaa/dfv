import { MongoConnect } from "./MongoConnect";
import { MongoTable } from "./MongoTable";
import { Collection, DeleteWriteOpResultObject, ObjectID, ReplaceOneOptions, UpdateWriteOpResult } from "mongodb";
import { MongoField } from "./MongoField";
import { SqlBuilder } from "./SqlBuilder";
import { IMongoOrderField, IMongoSelectField } from "./IMongoField";
import { ArrayCache, sql } from "../public/sql";
import { dfvLog } from "../dfvLog";
import { dfvLib, PreciseTime } from "../dfvLib";


export type SelectMongoFieldType<T> = {
    [P in keyof T]: IMongoSelectField<T[P]> & number & SelectMongoFieldType<T[P]>
};

export type SelectMongoOrderType<T> = {
    [P in keyof T]: IMongoOrderField & number & SelectMongoOrderType<T[P]>
};

export class MongoBuilder<TC extends any> {
    //查询或删除条件
    filter_: any = null;
    private skip_: number | null = null;
    private limit_: number | null = null;
    private valList: any[] = []

    //查询字段
    private sort_: any = null;

    //更新内容
    private update_: any = {};

    private select_: any = null;
    /**
     * 表名
     */
    private tableName: string = "";


    /**
     * 复制查询更新条件
     * @param name 表名
     * @returns {MongoBuilder<TC>}
     */
    copyTo(name?: string): MongoBuilder<TC> {
        let m = new MongoBuilder<TC>(this.className, this.connect, name);
        m.filter_ = this.filter_;
        m.skip_ = this.skip_;
        m.valList = this.valList;
        m.sort_ = this.sort_;
        m.update_ = this.update_;
        m.select_ = this.select_;
        return m;
    }


    constructor(private className: { new(): TC; }, public connect: MongoConnect, tableName?: string) {
        if (this.metaTableInfo() == null) {
            this.setMetaTableInfo(new MongoTable(className))
        }

        if (tableName) {
            this.tableName = tableName;
        } else {
            this.tableName = this.metaTableInfo().tableName;
        }

    }


    /**
     * 清空查询条件
     */
    clear() {
        this.filter_ = {};
        this.update_ = {};
        this.skip_ = null;
        this.limit_ = null;
        this.sort_ = null;
    }

    /**
     * 指定字段
     * @param func 字段表达式
     * @returns {SqlSession}
     */
    select(func: (f: SelectMongoFieldType<TC> & TC) => any): MongoBuilder<TC> {
        if (this.select_ == null)
            this.select_ = {};

        this.makeFunc(func)
        this.valList.forEach(it => {
            this.select_[it] = 1;
        })
        return this;
    }


    /**
     * 选定指定对象的字段
     * @param obj
     * @returns {any}
     */
    selectObj<K extends keyof TC>(obj: Record<K, any>): MongoBuilder<TC> {
        if (this.select_ == null)
            this.select_ = {};
        for (let k in obj) {
            this.select_[k] = 1;
        }
        return this as any;
    }

    /**
     * 排除字段
     * @param func 字段表达式
     * @returns {SqlSession}
     */
    unselect(func: (f: SelectMongoOrderType<TC> & TC) => any): MongoBuilder<TC> {
        if (this.select_ == null)
            this.select_ = {};

        this.makeFunc(func)
        this.valList.forEach(it => {
            this.select_[it] = 0;
        })
        return this;
    }

    /**
     * 添加sort条件
     * @param func 字段表达式
     * @returns {SqlSession}
     */
    order(func: (f: SelectMongoOrderType<TC> & TC) => any): MongoBuilder<TC> {

        if (!this.sort_)
            this.sort_ = {};
        this.makeUpdate(func, this.sort_);
        this.valList.forEach(it => {
            this.sort_[it] = 1;
        })
        return this;
    }

    /**
     * 排序字段,同order
     * @param func
     * @returns {MongoBuilder<TC>}
     */
    sort(func: (f: SelectMongoOrderType<TC> & TC) => any): MongoBuilder<TC> {
        return this.order(func);
    }

    /**
     * 跳过指行数,同limit(val)
     * @param val
     * @returns {MongoBuilder}
     */
    skip(val: number): MongoBuilder<TC> {
        this.skip_ = val;
        return this;
    }

    /**
     * limit
     * @param val 起始偏移位置,不传第二参数则表示个数
     * @param val2 个数
     * @returns {MongoBuilder}
     */
    limit(val: number, val2?: number): MongoBuilder<TC> {
        if (val2 !== void 0) {
            this.skip_ = val;
            this.limit_ = val2;
        }
        else {
            this.limit_ = val;
        }
        return this;
    }


    /**
     * 生成sql语句值列表
     * @param func
     */
    private makeFunc(func: (f: any) => any) {
        MongoField.runFunc(this.metaTableInfo(), func, this.valList);
    }

    private makeUpdate(func: ((f: any) => any) | null | undefined, obj: any) {
        if (!func)
            return;
        let old = this.metaTableInfo().update_;
        this.metaTableInfo().update_ = obj;
        let oldList = this.metaTableInfo().valList;
        this.valList.length = 0;
        this.metaTableInfo().valList = this.valList;
        var ret = func(this.metaTableInfo().classObj);
        if (ret) {
            if (ret instanceof MongoField) {
                ret.toString()
            }
            else if (ret instanceof sql) {
                var res = (ret as sql).func();
                this.valList.length = 0;
                this.valList.push(res);
            }
            else if (MongoField.getObjField(ret)) {
                ret.toString()
            }
        }
        this.metaTableInfo().valList = oldList;
        this.metaTableInfo().update_ = old;
    }

    /**
     * 重置where条件
     * @param func 条件lambda表达式
     * @returns {SqlBuilder}
     */
    where(func: (f: SelectMongoFieldType<TC> & TC) => any): MongoBuilder<TC> {
        this.makeFunc(func);
        this.filter_ = MongoField.makeWhere(func, this.valList);
        return this;
    }

    /**
     * 获取生成的where条件
     * @returns {any}
     */
    getWhere() {
        return this.filter_;
    }

    /**
     * 给where添加and条件
     * @param func 条件lambda表达式
     * @returns {SqlBuilder}
     */
    and(func: (f: SelectMongoFieldType<TC> & TC) => any): MongoBuilder<TC> {
        this.makeFunc(func);
        if (this.filter_ == null) {
            this.filter_ = MongoField.makeWhere(func, this.valList);
        }
        else {
            this.filter_ = { $and: [this.filter_, MongoField.makeWhere(func, this.valList)] }
        }
        return this;
    }

    /**
     * 给where添加or条件
     * @param func 条件lambda表达式
     * @returns {SqlBuilder}
     */
    or(func: (f: SelectMongoFieldType<TC> & TC) => any): MongoBuilder<TC> {
        this.makeFunc(func);
        if (this.filter_ == null) {
            this.filter_ = MongoField.makeWhere(func, this.valList);
        }
        else {
            this.filter_ = { $or: [this.filter_, MongoField.makeWhere(func, this.valList)] }
        }
        return this;
    }


    private logErr(stack: Error, err: Error, str: string) {
        this.connect.close();
        if (this.connect.cfg.errorLog) {
            stack.message = err.message;
            stack.name = err.name;
            dfvLog.write(this.connect.getConnectUrl() + "\r\n" + this.tableName + " " + str, stack);
        }
    }

    /**
     * 表元信息
     * @returns {SqlTableInfo}
     */
    private metaTableInfo() {
        return (this.className as any)._mongoInfo_ as MongoTable;
    }

    private setMetaTableInfo(table: MongoTable) {
        (this.className as any)._mongoInfo_ = table;
    }


    private getCacheTable() {
        return this.connect.getShortUrl() + this.tableName;
    }


    private getTableCacheMap() {
        let map = (this.metaTableInfo() as any)[this.getCacheTable()] as Map<string | number | null | undefined, TC[]>;
        if (!map) {
            map = new Map<string | number, TC[]>();
            (this.metaTableInfo() as any)[this.getCacheTable()] = map;
            MongoTable.cacheMap.set(this.getCacheTable(), map);
        }

        return map;
    }


    /**
     * 设置缓存结果排序
     */
    setCacheSort(func: (l: TC, r: TC) => number): this {
        this.cacheSort = func;
        return this;
    }

    private cacheSort?: (l: TC, r: TC) => number;

    /**
     * 从缓存中获取cacheId或cacheWhere的数据
     * @param id
     */
    cacheGet(id?: string | number | ObjectID): Promise<TC[]> {
        return new Promise((reso, reject) => {
            let cacheMap = this.getTableCacheMap();
            let list = cacheMap.get(id instanceof ObjectID ? id + "" : id);
            if (list) {
                (list as ArrayCache).__ReadCount = (list as ArrayCache).__ReadCount! + 1;
                reso(list);
                return;
            }


            if (this.filter_ == null) {
                this.filter_ = {}
            }
            if (this.metaTableInfo().cacheId) {
                this.filter_[this.metaTableInfo().cacheId] = id;
            }
            else if (this.metaTableInfo().cacheWhere) {
                this.filter_ = this.metaTableInfo().cacheWhere!(id as string);
            }
            else {
                reject(Error("没有指定sql.cacheId字段或cacheWhere"))
                return;
            }


            this.toArray().then(res => {
                //缓存已满,
                if (cacheMap.size >= this.connect.getMaxCache()!) {
                    SqlBuilder.clearCache(cacheMap);
                }

                (res as ArrayCache).__ReadCount = 0;
                if (this.cacheSort)
                    res!.sort(this.cacheSort);

                cacheMap.set(id instanceof ObjectID ? id + "" : id, res!)
                reso(res);
            }).catch(err => {
                reject(err);
            });
        })
    }

    /**
     * 清除所有表的缓存
     */
    static clearAllCache() {
        for (var m of MongoTable.cacheMap) {
            var k = m[0];
            var v = m[1];
            v.clear();
        }
    }

    static onCacheRemove(table: string, id?: string | number | null | ObjectID) {

    }

    /**
     * 从缓存中移除cacheId的数据
     * @param id
     */
    cacheRemove(id?: string | number | ObjectID) {
        if (id instanceof ObjectID)
            id = id + "";
        this.getTableCacheMap().delete(id as string);
        MongoBuilder.onCacheRemove(this.getCacheTable(), id)
        // if (InnerRpc.servers.length > 1) {
        //     for (let s of InnerRpc.servers) {
        //         let host = RpcServer.getHostName(s);
        //         if (RpcClass.hostName[host])
        //             continue;
        //         RpcServer.inner(s).delMongo(this.getCacheTable(), id);
        //     }
        // }
    }

    /**
     * 移除所有
     */
    cacheRemoveAll() {
        this.getTableCacheMap().clear();
    }


    /**
     * 获取collection并初始化索引
     * @returns {Promise<Collection>}
     */
    collection(): Promise<Collection> {
        return new Promise<Collection>((reso, reject) => {
            this.getCollection((err, cll) => {
                if (err)
                    reject(err)
                else
                    reso(cll)
            })
        })
    }

    /**
     * 获取collection并初始化索引
     * @param func
     */
    private getCollection(func: (err: Error | null, coll?: Collection) => void) {
        this.connect.connect((err, con) => {
            if (err) {
                func(err);
                return;
            }
            con.collection(this.tableName, { strict: true }, (err, coll) => {
                if (err) {
                    con.createCollection(this.tableName, (err, coll) => {
                        if (coll && this.metaTableInfo().index_.length > 0) {
                            // let ind = this.metaTableInfo().index_;
                            this.metaTableInfo().index_.forEach(it => {
                                coll.createIndex(it, (err, res) => {
                                    if (err && this.connect.cfg.errorLog)
                                        dfvLog.write(this.tableName + " createIndex:" + JSON.stringify(it), err);
                                });
                            })

                            func(err, coll);
                            return;
                        }
                        if (err && (err + "").indexOf("collection already exists") >= 0) {
                            func(null, con.collection(this.tableName));
                        }
                        else
                            func(err, coll);
                    });
                    return;
                }

                func(null, coll);
            });
        });

    }

    /**
     * 创建该表的所有索引
     */
    createAllIndex() {
        this.connect.connect((err, db) => {
            if (err && this.connect.cfg.errorLog) {
                dfvLog.err(err);
                return;
            }

            let index = this.metaTableInfo().index_;
            if (index.length > 0) {
                index.forEach(ind => {
                    db.createIndex(this.tableName, ind, (err, res) => {
                        if (err && this.connect.cfg.errorLog) {
                            dfvLog.err(err);
                            return;
                        }
                    })
                })
            }
        });
    }

    /**
     * 插入一条记录,id重复则改为更新
     * @param field
     * @returns {Promise<T>}
     */
    upsert(field: TC): Promise<UpdateWriteOpResult> {
        return new Promise((resolve, reject) => {
            var stack = new Error();
            this.getCollection((err, coll) => {
                if (err) {
                    this.logErr(stack, err, "upsert: " + JSON.stringify(field));
                    reject(err);
                    return;
                }

                coll!.updateOne(this.filter_, field, { upsert: true }, (err, res) => {
                    if (err) {
                        this.logErr(stack, err, "upsert: " + JSON.stringify(field));
                        reject(err);
                        return;
                    }

                    if (this.connect.cfg.updateLog) {
                        dfvLog.write(this.tableName + " upsert: " + JSON.stringify(field));
                    }

                    resolve(res);
                })
            });
        });
    }


    /**
     * insert
     * @param field 单个对象,或对象数组
     * @returns {Promise<T>} 影响行数,失败抛reject异常
     */
    insert(field: TC | TC[]): Promise<number> {
        var stack = new Error();
        return new Promise((resolve, reject) => {

            this.getCollection((err, coll) => {
                if (err) {
                    this.logErr(stack, err, "insert: " + JSON.stringify(field));
                    reject(err);
                    return;
                }
                var insertRes = (err: Error, res?: { insertedCount: number }) => {
                    if (err) {
                        this.logErr(stack, err, "insert: " + JSON.stringify(field));
                        reject(err);
                        return;
                    }

                    if (this.connect.cfg.updateLog) {
                        dfvLog.write(this.tableName + " insert: " + JSON.stringify(field));
                    }

                    if (!res)
                        resolve(0);
                    else
                        resolve(res.insertedCount);
                };

                if (field instanceof Array)
                    coll!.insertMany(field, insertRes);
                else
                    coll!.insertOne(field, insertRes);
            });
        });

    }


    private slowLog(lastTime: PreciseTime, stack: Error, str: string, update?: boolean) {
        if (this.connect.cfg.slowLog !== void 0) {
            let diffTime = lastTime.getMilli();
            if (diffTime >= this.connect.cfg.slowLog) {
                stack.message = "mongodb慢查询";
                stack.name = "slow query";
                if (update)
                    dfvLog.write(this.tableName + "执行时长:" + diffTime + "毫秒:\r\n" + str + JSON.stringify(this.filter_) + JSON.stringify(this.update_), stack);
                else
                    dfvLog.write(this.tableName + "执行时长:" + diffTime + "毫秒:\r\n" + str + JSON.stringify(this.filter_) + JSON.stringify(this.sort_), stack);
            }
        }

    }

    /**
     * 统计查询结果
     */
    count(): Promise<number> {
        var stack = new Error();

        return new Promise<number>((resolve, reject) => {

            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "count: " + JSON.stringify(this.filter_));
                    reject(err);
                    return;
                }

                if (this.connect.cfg.slowLog !== void 0)
                    var lastTime = dfvLib.getPreciseTime();

                con.collection(this.tableName).count(this.filter_, (err: Error, res: number) => {
                    if (err) {
                        this.logErr(stack, err, "count: " + JSON.stringify(this.filter_));
                        reject(err);
                        return;
                    }
                    if (this.connect.cfg.queryLog) {
                        dfvLog.write(this.tableName + " count: " + JSON.stringify(this.filter_) + "\r\n" + res);
                    }
                    this.slowLog(lastTime, stack, "count: ")
                    resolve(res);
                });
            });
        });


    }


    /**
     * 获取查询结果数组
     * @returns {Promise<T>}
     */
    toArray(): Promise<TC[]> {
        var stack = new Error();

        return new Promise((resolve, reject) => {

            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "toArray: " + JSON.stringify(this.filter_));
                    reject(err);
                    return;
                }

                if (this.connect.cfg.slowLog !== void 0)
                    var lastTime = dfvLib.getPreciseTime();

                var cur = con.collection(this.tableName).find(this.filter_, this.select_ ? this.select_ : void 0);

                if (this.sort_ != null)
                    cur.sort(this.sort_);

                if (this.skip_ != null)
                    cur.skip(this.skip_);

                if (this.limit_ != null)
                    cur.limit(this.limit_);

                cur.toArray((err, list) => {
                    if (err) {
                        this.logErr(stack, err, "toArray: " + JSON.stringify(this.filter_));
                        reject(err);
                        return;
                    }
                    if (!list)
                        list = [];

                    this.slowLog(lastTime, stack, "toArray: ")

                    if (this.connect.cfg.queryLog) {
                        if (this.connect.cfg.queryResultLog)
                            dfvLog.write(this.tableName + " toArray: " + JSON.stringify(this.filter_) + JSON.stringify(this.sort_) + "\r\n" + JSON.stringify(list));
                        else
                            dfvLog.write(this.tableName + " toArray: " + JSON.stringify(this.filter_) + JSON.stringify(this.sort_));
                    }

                    list.forEach(it => Object.setPrototypeOf(it, this.className.prototype));

                    resolve(list);
                });
            });
        });
    }


    /**
     * 查询并删除一条记录
     * @returns {Promise<T>}
     */
    findOneAndDelete(): Promise<TC | null> {
        var stack = new Error();

        return new Promise<TC | null>((resolve, reject) => {
            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "findOneAndDelete: " + JSON.stringify(this.filter_));
                    reject(err);
                    return;
                }

                if (this.connect.cfg.slowLog !== void 0)
                    var lastTime = dfvLib.getPreciseTime();

                con.collection(this.tableName).findOneAndDelete(this.filter_, (err, res) => {
                    if (err) {
                        this.logErr(stack, err, "findOneAndDelete: " + JSON.stringify(this.filter_));
                        reject(err);
                        return;
                    }
                    this.slowLog(lastTime, stack, "findOneAndDelete: ")

                    if (this.connect.cfg.queryLog) {
                        if (this.connect.cfg.queryResultLog)
                            dfvLog.write(this.tableName + " findOneAndDelete: " + JSON.stringify(this.filter_) + "\r\n" + JSON.stringify(res.value));
                        else
                            dfvLog.write(this.tableName + " findOneAndDelete: " + JSON.stringify(this.filter_));
                    }

                    if (res)
                        resolve(res.value);
                    else
                        resolve(null);
                });
            });
        });
    }


    /**
     * 获取单行一个对象(limit 1)
     * @returns {Promise<T>} 结果对象,或者null,失败抛reject异常
     */
    toOne(): Promise<TC | null> {
        var stack = new Error();

        return new Promise<TC | null>((resolve, reject) => {

            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "toOne: " + JSON.stringify(this.filter_));
                    reject(err);
                    return;
                }

                if (this.connect.cfg.slowLog !== void 0)
                    var lastTime = dfvLib.getPreciseTime();

                let cur = con.collection(this.tableName).find(this.filter_, this.select_ ? this.select_ : void 0);

                if (this.sort_ != null) {
                    cur.sort(this.sort_);
                }

                if (this.skip_ != null)
                    cur.skip(this.skip_);

                cur.limit(1);

                cur.next((err, list) => {
                    cur.close((err, list) => {
                    });
                    if (err) {
                        this.logErr(stack, err, "toOne: " + JSON.stringify(this.filter_));
                        reject(err);
                        return;
                    }
                    this.slowLog(lastTime, stack, "toOne: ")

                    if (this.connect.cfg.queryLog) {
                        if (this.connect.cfg.queryResultLog)
                            dfvLog.write(this.tableName + " toOne: " + JSON.stringify(this.filter_) + "\r\n" + JSON.stringify(list));
                        else
                            dfvLog.write(this.tableName + " toOne: " + JSON.stringify(this.filter_));
                    }


                    if (list)
                        Object.setPrototypeOf(list, this.className.prototype);

                    resolve(list);
                });
            });
        });
    }


    /**
     * 添加update条件
     * @param func 条件表达式
     * @returns {SqlBuilder}
     */
    set(func: (f: SelectMongoFieldType<TC> & TC) => any): MongoBuilder<TC> {
        this.makeUpdate(func, this.update_);
        return this;
    }

    /**
     * 更新
     * @param funcUpdate 条件,lambda表达式
     * @param opt update可选参数
     */
    update(funcUpdate?: (f: SelectMongoFieldType<TC> & TC) => any, opt: ReplaceOneOptions = {}): Promise<UpdateWriteOpResult> {
        if (!this.filter_)
            this.filter_ = {}

        this.makeUpdate(funcUpdate, this.update_);
        var stack = new Error();

        return new Promise((resolve, reject) => {

            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "update: " + JSON.stringify(this.filter_) + "\r\n" + JSON.stringify(this.update_));
                    reject(err);
                    return;
                }

                if (this.connect.cfg.slowLog !== void 0)
                    var lastTime = dfvLib.getPreciseTime();

                con.collection(this.tableName).updateMany(this.filter_, this.update_, opt, (err: Error, res: UpdateWriteOpResult) => {
                    if (err) {
                        this.logErr(stack, err, "update: " + JSON.stringify(this.filter_) + "\r\n" + JSON.stringify(this.update_));
                        reject(err);
                        return;
                    }

                    this.slowLog(lastTime, stack, "update: ", true)

                    if (this.connect.cfg.updateLog) {
                        dfvLog.write(this.tableName + " update: " + JSON.stringify(this.filter_) + "\r\n" + JSON.stringify(this.update_) + "\r\n" + JSON.stringify(res));
                    }

                    resolve(res);
                });

            });
        });
    }


    /**
     * 通过主键id更新整个对象
     * @param obj
     * @returns {Promise<T>}
     */
    updateById(obj: TC): Promise<UpdateWriteOpResult> {
        return new Promise((resolve, reject) => {
            var stack = new Error();
            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "updateById: " + JSON.stringify(obj));
                    reject(err);
                    return;
                }
                this.update_ = obj;

                if (this.connect.cfg.slowLog !== void 0)
                    var lastTime = dfvLib.getPreciseTime();

                con.collection(this.tableName).updateOne({ _id: obj["_id"] }, { "$set": obj } as any, (err: Error, res: UpdateWriteOpResult) => {
                    if (err) {
                        this.logErr(stack, err, "updateById: " + JSON.stringify(obj));
                        reject(err);
                        return;
                    }

                    this.slowLog(lastTime, stack, "updateById: ", true);

                    if (this.connect.cfg.updateLog) {
                        dfvLog.write(this.tableName + " updateById: " + JSON.stringify(obj) + "\r\n" + JSON.stringify(res));
                    }

                    resolve(err);
                });

            });

        });
    }

    delete(): Promise<number> {
        var stack = new Error();
        return new Promise((resolve, reject) => {
            this.connect.connect((err, con) => {
                if (err) {
                    this.logErr(stack, err, "delete: " + JSON.stringify(this.filter_));
                    reject(err);
                    return;
                }

                con.collection(this.tableName).deleteMany(this.filter_, (err: Error, res: DeleteWriteOpResultObject) => {
                    if (err) {
                        this.logErr(stack, err, "delete: " + JSON.stringify(this.filter_));
                        reject(err);
                        return;
                    }
                    if (this.connect.cfg.updateLog) {
                        dfvLog.write(this.tableName + " delete: " + JSON.stringify(this.filter_) + "\r\n" + JSON.stringify(res));
                    }

                    if (res)
                        resolve(res!.deletedCount);
                    else
                        resolve(0);
                });

            });
        });
    }


    ////////////////class end///////////////
}