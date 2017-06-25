export interface MysqlConfig {
    /**
     * sql错误日志
     */
    sqlErrorLog?: boolean;
    /**
     * 所有sql查询日志
     */
    sqlQueryLog?: boolean;

    /**
     * 所有查询结果日志
     */
    sqlQueryResultLog?: boolean
    /**
     * 所有sql更新日志
     */
    sqlUpdateLog?: boolean;

    /**
     * 慢查询日志,记录大于此时间(毫秒)的sql
     */
    sqlSlowLog?: number;

    /**
     * 每个表的最大对象缓存数量,缺省10000
     */
    maxCache?: number;
}

export interface IUpdateRes {
    /**
     * 影响行数
     */
    affectCount: number;

    /**
     * 自增id
     */
    insertId?: number;
}


export interface ISqlConnecter {

    /**
     * 少量数据查询，查询结果为数组
     * @param sqlStr
     * @param res
     */
    query(sqlStr: string, res: (err: Error, rows: any[] | null) => void): void;
    queryPromise(sqlStr: string): Promise<any[]>;

    /**
     * 大量数据查询
     * @param sqlStr sql语句
     * @param eachFunc 每读取到一行数据，就会触发此函数(可为async,抛异常则中断each)
     */
    queryEach(sqlStr: string, eachFunc: (row: any) => void | Promise<void>): Promise<void>;

    update(sqlStr: string, res: (err: Error | null, resault: IUpdateRes) => void): void;
    updatePromise(sqlStr: string): Promise<IUpdateRes>;
    /**
     * 获取链接名
     */
    getConnectName(): string;
    /**
     * 获取最大缓存数
     */
    getMaxCache(): number;

    /**
     * 执行事务操作
     * @param func 事务内容（通过抛异常来rollback中断事务）
     */
    transaction(func: () => Promise<void>): Promise<void>;
}