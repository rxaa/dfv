import assert = require('assert');
import {valid} from "../../src/public/valid";
import {dfv} from "../../src/public/dfv";
import {dfvBind} from "../../src/public/dfvBind";

class ReqTest {
    id = 1;
    val = "2";

    @valid.int(r => r.val > 0, "aaa必须大于0")
    aaa = 0;

    @valid.string(/^123$/, "bbb错误")
    bbb = "b";
}

class NotVaild {

}

class ReqTest5 {
    id = 1;
    val = "2";

    @valid.int(r => r.val > 0, "aaa必须大于0")
    aaa = 0;


    @valid.string()
    bbb = "b";

    ccc = {
        a: 1,
        b: 2,
    }
}

class ReqTest2 {
    id = 1;
    val = "2";

    @valid.int(r => r.val > 0, "aaa必须大于0")
    aaa = 0;


    @valid.string()
    bbb = "b";
}

class ReqSub extends ReqTest2 {
    abcs = "";
}

class ReqTest3 {
    id = 1;
    val = "2";


    bbb = new ReqTest2();
}


class ReqTest4 {
    id = 1;
    val = "2";


    @valid.object<ReqTest2>(r => r.val.bbb.length > 0, "bbb.bbb 不能为空")
    bbb = new ReqTest2();
}

class ReqTest6 {
    id = [1, 2];
}

class ArrayTest {

    @valid.array(r => r.val.eachToInt())
    bbb = [];

    @valid.array(r => r.val.eachToString())
    cccc = [];

    @valid.array(r => r.val.eachToObj(ReqTest2))
    ddd: ReqTest2[] = [];
}


describe('valid Test', function () {

    it('valid route array入参验证', function () {


        let aa = 1;
        var f = (a = 1, b = dfv.getRandFixNum(aa), c = 3) => {
        };

        assert.deepEqual(dfv.getParameterNames(f), ['a', 'b', 'c'])

        let notRes = valid.checkObj({
            bbb: [],
            cccc: [],
            ddd: [],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);

        notRes = valid.checkObj({
            bbb: null,
            cccc: [],
            ddd: [],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        assert.equal(JSON.stringify(notRes.val), `{\"bbb\":[],\"cccc\":[],\"ddd\":[]}`);

        notRes = valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        assert.equal(JSON.stringify(notRes.val), `{"bbb":[22,11,33],"cccc":["1","2","3"],"ddd":[]}`);

        notRes = valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [new ReqTest2()],
        }, new ArrayTest());
        assert.equal(notRes.ok, false);
        assert.equal(notRes.msg, "ddd" + valid.errMsg_);

        notRes = valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [1],
        }, new ArrayTest());
        assert.equal(notRes.ok, false);
        assert.equal(notRes.msg, "ddd" + valid.errMsg_);

        let req = new ReqTest2();
        req.aaa = 2;
        notRes = valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [req, req],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        assert.equal(JSON.stringify(notRes.val), `{"bbb":[22,11,33],"cccc":["1","2","3"],"ddd":[{"id":1,"val":"2","aaa":2,"bbb":"b"},{"id":1,"val":"2","aaa":2,"bbb":"b"}]}`);
    });

    it('valid route 入参验证', async function () {

        let notRes = valid.checkObj({}, new NotVaild());
        assert.equal(notRes.ok, true);

        let res = valid.checkObj({
            aaa: 2,
            bbb: "123",
        }, new ReqTest());
        assert.equal(res.ok, true);
        assert.equal(res.val.id, 1);
        assert.equal(res.val.val, "2");

        res = valid.checkObj({
            aaa: 2,
            bbb: "aaa",
        }, new ReqTest());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "bbb错误");


        res = valid.checkObj({
            aaa: 0,
            bbb: "123",
        }, new ReqTest());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "aaa必须大于0");

        res = valid.checkObj({
            aaa: 1,
        }, new ReqTest2());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "bbb" + valid.errMsg_);

        let re2 = valid.checkObj({
            bbb: {
                aaa: 10,
                bbb: "123",
            }
        }, new ReqTest3());
        assert.equal(re2.ok, true);

        re2 = valid.checkObj({
            bbb: {
                aaa: 0,
                bbb: "123",
            }
        }, new ReqTest3());
        assert.equal(re2.ok, false);
        assert.equal(re2.msg, "aaa必须大于0");

        re2 = valid.checkObj({
            bbb: {}
        }, new ReqTest3());
        assert.equal(re2.ok, false);
        assert.equal(re2.msg, "aaa必须大于0");


        re2 = valid.checkObj({
            bbb: {
                aaa: 1,
                bbb: "",
            }
        }, new ReqTest4());
        assert.equal(re2.ok, false);
        assert.equal(re2.msg, "bbb.bbb 不能为空");

        re2 = valid.checkObj({
            bbb: {
                aaa: 1,
                bbb: "1",
            }
        }, new ReqTest4());
        assert.equal(re2.ok, true);


        res = valid.checkObj({
            aaa: 1,
        }, new ReqSub());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "bbb" + valid.errMsg_);

        res = valid.checkObj({
            aaa: 1,
            bbb: "",
        }, new ReqSub());
        assert.equal(res.ok, true);

        let rrr = valid.checkObj({
            id: [1, 2, 3]
        }, new ReqTest6);
        assert.equal(res.ok, true);
        assert.equal(JSON.stringify(rrr.val), "{\"id\":[1,2,3]}");

        rrr = valid.checkObj({
            id: 123
        }, new ReqTest6);
        assert.equal(res.ok, true);
        assert.equal(JSON.stringify(rrr.val), `{"id":[1,2]}`);

        let bi = dfvBind(e => true, {onSet: val => val});
        assert.equal(await bi.onSet!(1, bi, {} as any), 1);
        bi = dfvBind(e => true, {onSet: async (val) => val});
        assert.equal(await bi.onSet!(2, bi, {} as any), 2);

    });
});