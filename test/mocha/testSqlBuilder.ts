import { dfvLib } from "../../src/dfvLib";

dfvLib.init(__dirname)

import assert = require('assert');
import { ISqlConnecter, IUpdateRes } from "../../src/db/ISqlConnecter";
import { sql } from "../../src/public/sql";
import { SqlBuilder } from "../../src/db/SqlBuilder";


class DBcon implements ISqlConnecter {
    queryPromise(sqlStr: string): Promise<any[]> {
        throw new Error("Method not implemented.");
    }

    queryEach(sqlStr: string, eachFunc: (row: any) => void | Promise<void>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    updatePromise(sqlStr: string): Promise<IUpdateRes> {
        throw new Error("Method not implemented.");
    }

    transaction(func: (tra: ISqlConnecter) => Promise<void>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    query(sqlStr: string, res: (err: Error | null, rows: any[] | null) => void) {
        res(null, [])
    }

    update(sqlStr: string, res: (err: Error | null, resault: IUpdateRes) => void) {
        res(null, { affectCount: 0 })
    }

    getConnectName(): string {
        return "";
    }

    getMaxCache(): number {
        return 1000;
    }

}

class SqlBu {

    @sql.primaryKey
    tid = "";

    /**
     * 名字
     */
    name = "";

    /**
     * 值
     */
    val = 0;

    static sql() {
        return new SqlBuilder<SqlBu>(SqlBu, new DBcon());
    }

}

class SqlTableTest {

    @sql.primaryKey
    id: string = "";

    /**
     * 名字
     */
    name = "";

    /**
     * 值
     */
    val = 0;

    static sql() {
        return new SqlBuilder<SqlBu>(SqlBu, new DBcon(), SqlBu.sql().innerJoin(SqlTableTest, (l, r) => l.tid.eq(r.id)));
    }


    static inner1 = SqlBu.sql().innerJoin(SqlTableTest, (l, r) => l.tid.eq(r.id)).leftJoin(SqlTableTest, (l, r, p3) => l.name.eq(r.id) & l.name.eq(r.name)).rightJoin(SqlTableTest, (l, r, p3, p4) => l.name.eq(r.id));


    static sql2() {
        return new SqlBuilder<SqlBu>(SqlBu, new DBcon(), SqlTableTest.inner1);
    }

}

class T1 {
    @sql.primaryKey
    id: string = "";

    @sql.fieldName("aaaa")
    filed = "";

    @sql.fieldTable(SqlTableTest)
    f2 = ""

    @sql.fieldTable(SqlTableTest)
    @sql.fieldName("ccc")
    f3 = ""

    static sql() {
        return new SqlBuilder(T1, new DBcon());
    }
}

describe('sqlBuilder Test', function () {

    let s = `jdj0934823d\\csd'23\\dcs'2'32\\'2\\3\\23'f\\2\\323'\\232323f\\3333`
    // for (let i = 0; i < 5; i++) {
    //     s = s + s;
    // }
    it("sql src", () => {
        assert.equal(sql.filter(s), `'jdj0934823d\\\\csd\\'23\\\\dcs\\'2\\'32\\\\\\'2\\\\3\\\\23\\'f\\\\2\\\\323\\'\\\\232323f\\\\3333'`);
    });

    // it("sql t1", () => {
    //     for (let i = 0; i < 100000; i++) {
    //         sql.filter(s);
    //     }
    // });
    // it("sql t2", () => {
    //     for (let i = 0; i < 100000; i++) {
    //         sql.filter2(s);
    //     }
    // });

    it("builder", async () => {
        assert.equal(sql.filter(123), "123");
        assert.equal(sql.filter(`aaa'a`), "'aaa\\'a'");

        let s = SqlBu.sql();
        s.select("name", "tid");
        s.where(f => f.name.eq("abc").and.tid.eq("ww'w").or.val.notEq(987));
        s.and(f => sql.src`${f.name}=123 and ${f.tid}>666`).or(f => f.val.notEq(987))
        s.and(f => f.val.eq(233).and.name.in(SqlBu.sql().select("name").where(f => f.val.eq(1))))
        s.and(f => f.val.notIn([1, 2, 3]).andWrap(f => f.name.eq("uuu").or.tid.eq("ttt")).tid.eq("ppp"));

        s.order(f => f.val.mul(f.val).add(f.tid.mul(f.tid)).asc);
        s.order(f => f.val.asc.name.desc.tid.asc);

        s.groupBy("val", "name");
        s.group(f => f.name.mul(f.name));
        s.limit(1, 2)



        assert.equal(s.getSelectSql()
            , "select `name`,`tid` from `SqlBu` where  `name` = 'abc'  and  `tid` = 'ww\\'w'  or  `val` != 987  and `name`=123 and `tid`>666 or  `val` != 987  and  `val` = 233  and  `name` in ((select `name` from `SqlBu` where  `val` = 1 ))  and  `val` not in (1,2,3)  and ( `name` = 'uuu'  or  `tid` = 'ttt' )  `tid` = 'ppp'  group by `val`,`name`, `name`*`name`  order by    `val`*`val` + `tid`*`tid`   asc , `val` asc , `name` desc , `tid` asc  limit 1,2")

        let s2 = SqlBu.sql();
        s2.selectAs(f => ({
            valSum: f.val.sum(),
            name: f.name,
        }))
        s2.and(f => f.val.gtEq(1).and.val.le(2).or.val.leEq(5).or.val.notEq(10).or.val.in([1, 2, 3]).or.val.in(7))
        s2.and(f => f.val.eq(f.val.sum()))
        s2.and(f => f.tid.eq(f.name))
        s2.or(f => f.val.set(f.val.add(1)))
        s2.or(f => f.val.eq(f.val.add(f.name.avg())).and.val.eq(f.val.sub(444).add(555).mul(222).div(666)))
        assert.equal(s2.getSelectSql(),
            "select  sum(`val`)  as `valSum`,`name` as `name` from `SqlBu` where  `val` >= 1  and  `val` < 2  or  `val` <= 5  or  `val` != 10  or  `val` in (1,2,3)  or  `val` in (7)  and  `val` =  sum(`val`)   and  `tid` = `name`  or  `val` =  `val`+1   or  `val` =  `val`+ avg(`name`)    and  `val` =     `val`-444 +555 *222 /666  ");

        s = SqlBu.sql().set(f => f.name.eq("2").and.tid.set("3"));
        s.set(f => f.val.set(f.val.add(3)).val.subSet(5));
        s.set(f => f.name.concat(f.tid, "123"));
        s.set(f => f.val.set(2).name.concat("abc", f.name));
        s.where(f => f.name.gt("aaa"))
        await s.update(f => f.val.set(6));
        assert.equal(s.toString(),
            "update `SqlBu` set  `name` = '2' , `tid` = '3' , `val` =  `val`+3  , `val` = `val`-5 , `name`=concat(`tid`,'123') , `val` = 2 , `name`=concat('abc',`name`) , `val` = 6  where  `name` > 'aaa' ");

        let ia = new SqlBu();
        let inst = SqlBu.sql();
        await inst.insert(ia)
        assert.equal(inst.toString()
            , "insert into `SqlBu`( `tid`,`name`,`val`) values( '','',0)")

        await inst.updateById(ia)
        assert.equal(inst.toString()
            , "update `SqlBu` set `name`='',`val`=0 where `tid`=''")

        let t1 = T1.sql();
        await t1.where(f => f.f2.eq("1").and.f3.eq("2").and.filed.eq("3"))
            .and(f => f.f3.eq("fff3"))
            .order(f => f.filed.asc.f2.desc.f3.asc).toArray();
        assert.equal(t1.toString()
            , "select `id`,`aaaa` as `filed`,`SqlTableTest`.`f2`,`SqlTableTest`.`ccc` as `f3` from `T1` where  `SqlTableTest`.`f2` = '1'  and  `SqlTableTest`.`ccc` = '2'  and  `aaaa` = '3'  and  `SqlTableTest`.`ccc` = 'fff3'  order by  `aaaa` asc , `SqlTableTest`.`f2` desc , `SqlTableTest`.`ccc` asc ")


        t1 = T1.sql();
        await t1.insert(new T1())
        assert.equal(t1.toString(),
            "insert into `T1`( `id`,`aaaa`,`SqlTableTest`.`f2`,`SqlTableTest`.`ccc`) values( '','','','')");

        t1 = T1.sql();
        await t1.updateById(new T1())
        assert.equal(t1.toString(),
            "update `T1` set `aaaa`='',`SqlTableTest`.`f2`='',`SqlTableTest`.`ccc`='' where `id`=''");

        t1 = T1.sql();
        await t1.where(f => f.f3.eq("1")).set(f => f.f2.eq("2").and.f3.eq("3")).update(f => f.filed.eq("4"));
        assert.equal(t1.toString(),
            "update `T1` set  `SqlTableTest`.`f2` = '2' , `SqlTableTest`.`ccc` = '3' , `aaaa` = '4'  where  `SqlTableTest`.`ccc` = '1' ");


        t1 = T1.sql().order(f => f.id.asc).order(f => f.f2.desc);
        await t1.toArray();
        assert.equal(t1.toString(), "select `id`,`aaaa` as `filed`,`SqlTableTest`.`f2`,`SqlTableTest`.`ccc` as `f3` from `T1` order by  `id` asc , `SqlTableTest`.`f2` desc ");

        t1 = T1.sql().groupBy("id","filed").groupBy("f2");
        await t1.toArray();
        assert.equal(t1.toString(), "select `id`,`aaaa` as `filed`,`SqlTableTest`.`f2`,`SqlTableTest`.`ccc` as `f3` from `T1` group by `id`,`aaaa`,`SqlTableTest`.`f2`");
    });

});