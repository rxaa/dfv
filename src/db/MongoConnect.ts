import * as mongodb from "mongodb";
import { dfvLog } from "../dfvLog";


export interface MongoCfg {
    /**
     * 主机地址
     */
    host: string,
    /**
     * 端口
     */
    port: number,
    /**
     * 库名
     */
    database: string,
    /**
     * 用户名
     */
    user: string,
    /**
     * 密码
     */
    password: string,
    /**
     * 验证源
     */
    authSource?: string,

    /**
     * 错误日志
     */
    errorLog?: boolean;
    /**
     * 所有查询日志
     */
    queryLog?: boolean;

    /**
     * 所有查询结果日志
     */
    queryResultLog?: boolean
    /**
     * 所有更新日志
     */
    updateLog?: boolean;

    /**
     * 慢查询日志,记录大于此时间(毫秒)的查询
     */
    slowLog?: number;

    /**
     * 每个表的最大对象缓存数量,缺省10000
     */
    maxCache?: number;
}

export class MongoConnect {

    conn: mongodb.MongoClient | null = null;

    db: mongodb.Db | null = null;


    constructor(public cfg: MongoCfg) {
        if (this.cfg.maxCache === void 0) {
            this.cfg.maxCache = 10000;
        }
    }


    connect(res: (err: Error | null, db: mongodb.Db) => void) {
        if (this.db) {
            res(null, this.db);
            return;
        }

        mongodb.MongoClient.connect(this.getConnectUrl(), (err, con) => {
            if (!err) {
                this.conn = con;
                this.db = con.db(this.cfg.database);
            }
            res(err, this.db!);
        });
    }

    connectPromise(): Promise<mongodb.Db> {
        return new Promise((reso, reject) => {
            this.connect((err, db) => {
                if (err)
                    reject(err);
                else {
                    reso(db);
                }

            })
        });
    }

    close() {
        if (this.conn) {
            let d: any = this.conn;
            if (d.s && d.s.topology && d.s.topology.isConnected) {
                if (d.s.topology.isConnected()) {
                    return;
                }
                else {
                    this.conn.close(true)
                    this.conn = null;
                }
            }
            else {
                if (this.cfg.errorLog)
                    dfvLog.write("no s.topology.isConnected function")
                this.conn.close(true)
                this.conn = null;
            }

        }

    }

    getShortUrl() {
        return this.cfg.host + ":" + this.cfg.port + "/" + this.cfg.database + "_";
    }

    getMaxCache() {
        return this.cfg.maxCache;
    }

    getConnectUrl() {
        let ret = ""
        if (this.cfg.user)
            ret = "mongodb://" + encodeURIComponent(this.cfg.user) + ":" + encodeURIComponent(this.cfg.password) + "@" + this.cfg.host
                + ":" + this.cfg.port + "/" + encodeURIComponent(this.cfg.database) + "?"
        else {
            ret = "mongodb://" + this.cfg.host
                + ":" + this.cfg.port + "/" + encodeURIComponent(this.cfg.database) + "?"
        }

        if (this.cfg.authSource) {
            ret += "authSource=" + this.cfg.authSource;
        }

        return ret;
    }
}