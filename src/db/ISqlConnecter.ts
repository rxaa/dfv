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
    query(sqlStr: string, res: (err: Error, rows: any[] | null) => void);
    queryPromise(sqlStr: string): Promise<any[]>;

    update(sqlStr: string, res: (err: Error | null, resault: IUpdateRes) => void);
    updatePromise(sqlStr: string): Promise<IUpdateRes>;
    /**
     * 获取链接名
     */
    getConnectName(): string;
    getMaxCache(): number;

    transaction(func: () => Promise<void>): Promise<void>;
}