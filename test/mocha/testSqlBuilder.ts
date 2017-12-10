import {dfvLib} from "../../src/dfvLib";

dfvLib.init(__dirname)

import assert = require('assert');
import {ISqlConnecter, IUpdateRes} from "../../src/db/ISqlConnecter";
import {sql} from "../../src/public/sql";
import {SqlBuilder} from "../../src/db/SqlBuilder";


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

    transaction(func: (tra:ISqlConnecter) => Promise<void>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    query(sqlStr: string, res: (err: Error | null, rows: any[] | null) => void) {
        res(null, [])
    }

    update(sqlStr: string, res: (err: Error | null, resault: IUpdateRes) => void) {
        res(null, {affectCount: 0})
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
        s.select(f => f.name & f.tid);
        s.where(f => f.name.eq("123") & !(f.tid.like("aaa") | f.val.gtEq(456))as any);
        s.and(f => sql.src `${f.name}=123 and ${f.tid}>666`).or(f => f.val.notEq(987))
        s.and(f => f.val.eq(233) & f.name.in(SqlBu.sql().select(f => f.name).where(f => f.val.eq(1))))
        s.and(f => f.val.notIn([1, 2, 3]));
        s.order(f => f.val.asc() + f.name.desc() + f.tid.asc());
        s.groupBy(f => f.name + f.tid)
        s.limit(1, 2)

        assert.equal(s.getSelectSql()
            , "select  name,tid from SqlBu where  name='123'  and !( tid like 'aaa'  or  val>=456 ) and name=123 and tid>666 or  val!=987  and  val=233  and  name in ((select  name from SqlBu where  val=1 ))  and  val not in ( 1,2,3)  group by name,tid order by  val asc , name desc , tid asc  limit 1,2")


        let s2 = SqlBu.sql();
        s2.select(f => f.val.sum() & f.name & f.val.add(2));
        s2.and(f => f.val.gtEq(1) & f.val.le(2) | f.val.leEq(5) | f.val.notEq(10) | f.val.in([1, 2, 3]) | f.val.in(7))
        s2.and(f => f.val.eq(f.val.sum()))
        s2.and(f => f.tid.eq(f.name))
        s2.or(f => f.val.set(f.val.add(1)))
        s2.or(f => (f.val.addSet(f.name.avg()) | f.val.subSet(678) | f.val.set(f.val.sub(444).add(555).mul(222).div(666))))
        assert.equal(s2.getSelectSql(),
            "select   sum(val) ,name, val+2  from SqlBu where  val>=1  and  val<2  or  val<=5  or  val!=10  or  val in ( 1,2,3)  or  val in (7)  and  val= sum(val)   and  tid=name  or  val= val+1   or ( val=val+ avg(name)   or  val=val-678  or  val=    val-444 +555 *222 /666  )");

        assert.equal(SqlTableTest.sql2().getTableName(),
            "SqlBu inner join SqlTableTest on  SqlBu.tid=SqlTableTest.id  left join SqlTableTest on  SqlBu.name=SqlTableTest.id  and  SqlBu.name=SqlTableTest.name  right join SqlTableTest on  SqlBu.name=SqlTableTest.id ");

        assert.equal(SqlTableTest.sql().getTableName(),
            "SqlBu inner join SqlTableTest on  SqlBu.tid=SqlTableTest.id ");


        s = SqlBu.sql().set(f => f.name.eq("2") + f.tid.eq("3"));
        s.set(f => f.val.eq(f.val.add(3)) + f.val.subSet(5));
        s.set(f => f.name.concat(f.tid, "123"));
        s.set(f => f.val.set(2) + f.name.concat("abc", f.name));
        await s.update(f => f.val.set(6));
        assert.equal(s.toString(),
            "update SqlBu set  name='2' , tid='3' , val= val+3  , val=val-5 , name=concat(tid,'123'), val=2 , name=concat('abc',name), val=6 ");


        let s4 = SqlBu.sql().selectAs(f => ({
            a: f.name,
            b: f.tid,
            c: f.val.sum(),
        }));


        assert.equal(s4.getSelectSql()
            , "select name as a,tid as b, sum(val)  as c from SqlBu")

        let ia = new SqlBu();
        let inst = SqlBu.sql();
        await inst.insert(ia)
        assert.equal(inst.toString()
            , "insert into SqlBu( tid,name,val) values( '','',0)")

        await inst.updateById(ia)
        assert.equal(inst.toString()
            , "update SqlBu set name='',val=0 where tid=''")


        let t1 = T1.sql();
        await t1.where(f => f.f2.eq("1") & f.f3.eq("2") & f.filed.eq("3") )
            .order(f => f.filed.asc() & f.f2.desc() & f.f3.asc()).toArray();
        assert.equal(t1.toString()
            , "select id,aaaa as filed,SqlTableTest.f2,SqlTableTest.ccc as f3 from T1 where  SqlTableTest.f2='1'  and  SqlTableTest.ccc='2'  and  aaaa='3'  order by  aaaa asc , SqlTableTest.f2 desc , SqlTableTest.ccc asc ")


        t1 = T1.sql();
        await t1.insert(new T1())
        assert.equal(t1.toString(),
            "insert into T1( id,aaaa,f2,ccc) values( '','','','')");

        t1 = T1.sql();
        await t1.updateById(new T1())
        assert.equal(t1.toString(),
            "update T1 set aaaa='',SqlTableTest.f2='',SqlTableTest.ccc='' where id=''");

        t1 = T1.sql();
        await t1.where(f => f.f3.eq("1")).set(f => f.f2.eq("2") & f.f3.eq("3")).update(f => f.filed.eq("4"));
        assert.equal(t1.toString(),
            "update T1 set  SqlTableTest.f2='2' , SqlTableTest.ccc='3' , aaaa='4'  where  SqlTableTest.ccc='1' ");


        t1 = T1.sql().order(f => f.id.asc()).order(f => f.f2.desc());
        await t1.toArray();
        assert.equal(t1.toString(), "select id,aaaa as filed,SqlTableTest.f2,SqlTableTest.ccc as f3 from T1 order by  id asc , SqlTableTest.f2 desc ");

        t1 = T1.sql().groupBy(f => f.id + f.filed).groupBy(f => f.f2);
        await t1.toArray();
        assert.equal(t1.toString(), "select id,aaaa as filed,SqlTableTest.f2,SqlTableTest.ccc as f3 from T1 group by id,aaaa,SqlTableTest.f2");

    });

});