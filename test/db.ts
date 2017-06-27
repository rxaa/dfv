import {IPoolConfig} from "mysql";
import {MysqlConfig} from "../src/db/ISqlConnecter";
import {MysqlConnecter} from "../src/db/MysqlConnecter";
import {MongoCfg, MongoConnect} from "../src/db/MongoConnect";


export class db {
    static configMysql: IPoolConfig & MysqlConfig = {
        host: '127.0.0.1',
        user: 'root',
        password: '123456',
        database: 'blog',
        port: 3306,
        sqlErrorLog: true,
        sqlQueryLog: true,
        // sqlQueryResultLog: true,
        sqlUpdateLog: true,
        sqlSlowLog: 500,
        maxCache: 10000,
    }

    static mysql = new MysqlConnecter(db.configMysql);


    private static mongoCfg: MongoCfg = {
        host: "127.0.0.1",
        port: 27017,
        database: "test",
        user: "root",
        password: "123456",
        errorLog: true,
        slowLog: 500,
        queryLog: true,
        //queryResultLog:true,
        updateLog: true,
    }

    static mongo = new MongoConnect(db.mongoCfg)
}

