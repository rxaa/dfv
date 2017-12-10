import {ISqlConnecter, IUpdateRes, MysqlConfig} from "./ISqlConnecter";
import {IConnection, IPool, IPoolConfig} from "mysql";
import * as mysql from "mysql";
import {dfvLib} from "../dfvLib";
import {dfvLog} from "../dfvLog";


export class MysqlConnecter implements ISqlConnecter {


    constructor(public config: IPoolConfig & MysqlConfig, private pool: IPool = mysql.createPool(config)) {
        if (config.maxCache === void 0) {
            config.maxCache = 10000;
        }
    }


    /**
     * 事务链接，当开启事务模式时，该属性非空，且不能release()
     */
    private transactionConn: IConnection | null = null;


    query(sqlStr: string, res: (err: Error | null, rows: any[] | null) => void) {
        let errStack = new Error();

        let queryFunc = (conn: IConnection) => {

            //计时
            if (this.config.sqlSlowLog != null) {
                var lastTime = dfvLib.getPreciseTime();
            }

            conn.query(sqlStr, (err, rows) => {
                if (err) {
                    if (this.config.sqlErrorLog) {
                        errStack.message = err.message
                        errStack.name = err.name;
                        dfvLog.write("query  error:\r\n" + sqlStr, errStack);
                    }
                }
                else {
                    if (this.config.sqlSlowLog != null) {
                        let diffTime = lastTime.getMilli();
                        if (diffTime >= this.config.sqlSlowLog) {
                            errStack.message = "sql慢查询";
                            errStack.name = "slow sql";
                            dfvLog.write("sql执行时长:" + diffTime + "毫秒:\r\n" + sqlStr, errStack);
                        }
                    }
                }


                if (this.config.sqlQueryLog && !err) {
                    if (this.config.sqlQueryResultLog)
                        dfvLog.write(sqlStr + "\r\n" + JSON.stringify(rows));
                    else
                        dfvLog.write(sqlStr);
                }

                if (!this.transactionConn)
                    conn.release();
                res(err, rows);
            });
        }


        if (this.transactionConn) {
            queryFunc(this.transactionConn);
        }
        else {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    if (this.config.sqlErrorLog)
                        dfvLog.write("POOL getConnection error:\r\n" + sqlStr, err);
                    res(err, null);
                    return;
                }

                queryFunc(conn);
            });
        }
    }

    queryPromise(sqlStr: string): Promise<any[]> {
        return new Promise<any[]>((reso, reject) => {
            this.query(sqlStr, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (!res)
                        res = [];
                    reso(res);
                }
            })
        });
    }

    update(sqlStr: string, res: (err: Error | null, resault: IUpdateRes) => void) {
        var errStack = new Error();

        let updateFunc = (conn: IConnection) => {
            conn.query(sqlStr, (err, result) => {
                var update: IUpdateRes = {affectCount: 0};
                if (err) {
                    if (this.config.sqlErrorLog) {
                        errStack.message = err.message
                        errStack.name = err.name;
                        dfvLog.write("update error:\r\n" + sqlStr, errStack);
                    }
                }

                if (result) {
                    if (result.affectedRows)
                        update.affectCount = result.affectedRows;

                    if (result.changedRows)
                        update.affectCount = result.changedRows;

                    if (result.insertId)
                        update.insertId = result.insertId;
                }

                if (!this.transactionConn)
                    conn.release();

                if (this.config.sqlUpdateLog && !err) {
                    dfvLog.write(sqlStr + "\r\n" + JSON.stringify(update));
                }

                res(err, update);
            });
        }

        if (this.transactionConn) {
            updateFunc(this.transactionConn);
        }
        else {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    if (this.config.sqlErrorLog) {
                        dfvLog.write("POOL getConnection error:\r\n" + sqlStr, err);
                    }
                    res(err, {affectCount: 0});
                    return;
                }
                updateFunc(conn);
            });
        }
    }

    updatePromise(sqlStr: string): Promise<IUpdateRes> {
        return new Promise<IUpdateRes>((reso, reject) =>
            this.update(sqlStr, (err, res) => err ? reject(err) : reso(res))
        );
    }


    getConnectName(): string {
        return this.config.host + "" + this.config.port + this.config.database;
    }

    getMaxCache(): number {
        if (!this.config.maxCache)
            return 10000;

        return this.config.maxCache;
    }


    /**
     * 执行事务操作
     * @param func 事务内容（通过抛异常来rollback中断事务）
     */
    transaction(func: (conTran: ISqlConnecter) => Promise<void>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    if (this.config.sqlErrorLog) {
                        dfvLog.write("transaction getConnection error", err);
                    }
                    reject(err);
                    return;
                }


                conn.beginTransaction(err => {
                    if (err) {
                        if (this.config.sqlErrorLog)
                            dfvLog.write("beginTransaction error", err);
                        reject(err);
                        return;
                    }
                    let tran = new MysqlConnecter(this.config, this.pool);
                    tran.transactionConn = conn;

                    func(tran).then(() => {
                        // this.transactionConn = null;
                        conn.commit(err => {
                            try {
                                conn.release();
                            } catch (e) {
                                if (this.config.sqlErrorLog)
                                    dfvLog.write("conn.release error", e);
                            }
                            if (err) {
                                if (this.config.sqlErrorLog)
                                    dfvLog.write("beginTransaction commit error", err);
                                reject(err);
                                return;
                            }

                            //执行成功
                            resolve();
                        });
                    }).catch(err => {
                        // this.transactionConn = null;
                        if (this.config.sqlErrorLog)
                            dfvLog.write("beginTransaction catch error", err);
                        conn.rollback(() => {
                            try {
                                conn.release();
                            } catch (e) {
                                if (this.config.sqlErrorLog)
                                    dfvLog.write("conn.release error", e);
                            }
                        });
                        reject(err);
                    });
                });
            });
        });
    }


    queryEach(sqlStr: string, func: (row: any) => (void | Promise<void>)): Promise<void> {
        let errStack = new Error();

        let lastErr: any = null;
        // let i = 0;

        return new Promise<void>((reso, reject) => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    if (this.config.sqlErrorLog)
                        dfvLog.write("POOL getConnection error:\r\n" + sqlStr, err);
                    reject(err);
                    return;
                }


                if (this.config.sqlQueryLog) {
                    dfvLog.write(sqlStr);
                }

                let query = conn.query(sqlStr);
                query
                    .on('error', (err) => {
                        lastErr = err;
                        // Handle error, an 'end' event will be emitted after this as well
                        if (this.config.sqlErrorLog) {
                            errStack.message = err.message;
                            errStack.name = err.name;
                            dfvLog.write("queryAll error:\r\n" + sqlStr, errStack);
                        }
                        conn.release();
                        reject(err);
                    })
                    .on('fields', (fields) => {
                        // the field packets for the rows to follow
                    })
                    .on('result', async (row, index) => {

                        if (lastErr) {
                            // console.error("lastErr 统计" + (++i))
                            return;
                        }

                        // Pausing the connnection is useful if your processing involves I/O
                        conn.pause();
                        try {
                            await func(row);
                            conn.resume();
                        } catch (e) {
                            lastErr = e;
                            try {
                                // conn.resume();
                                conn.destroy();
                            } catch (e) {
                                dfvLog.write("queryAll destroy error:\r\n" + sqlStr, e);
                            }
                            reject(e);
                        }
                    })
                    .on('end', function () {
                        // all rows have been received
                        if (!lastErr) {
                            conn.release();
                            reso();
                        }
                    });
            });
        });
    }

}