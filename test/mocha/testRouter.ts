import assert = require('assert');
import {valid} from "../../public/valid";
import {dfvHttpClient} from "../../src/dfvHttpClient";


require("../koa");
require("../express");


describe('router Test', function () {


    const testFunc = async (port: number) => {
        let ht = new dfvHttpClient(`http://localhost:${port}/user/test1-333?name=abc&val=3`);
        let res = await ht.get();
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":333,"name":"abc","val":3}`);

        ht.setUrl(`http://localhost:${port}/user/test1-444?id=2&name=ttt&val=5`)
        res = await ht.get();
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":444,"name":"ttt","val":5}`);

        ht.setUrl(`http://localhost:${port}/user/test1-444?name=ttt&val=2`)
        res = await ht.get();
        assert.equal(res.code, 500);
        assert.equal(res.content, `val必须大于2`);


        ht.setUrl(`http://localhost:${port}/user/test1-444?name=ttt&val=2`)
        res = await ht.get();
        assert.equal(res.code, 500);
        assert.equal(res.content, `val必须大于2`);


        ht.setUrl(`http://localhost:${port}/user/test2-444?id=2&name=ttt`)
        res = await ht.header.setJson().post(`{"val":66}`);
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":444,"name":"ttt","val":66}`);

        ht.setUrl(`http://localhost:${port}/user/test2-444?id=2&name=ttt`)
        res = await ht.header.setForm().post(`val=666`);
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":444,"name":"ttt","val":666}`);


        ht.setUrl(`http://localhost:${port}/user/test3?id=2&name=ttt`)
        res = await ht.header.setForm().post(`val=666`);
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":2,"name":"ttt","val":666}`);

        ht.setUrl(`http://localhost:${port}/user/test3?id=2&name=ttt`)
        res = await ht.header.setForm().post(`val=2`);
        assert.equal(res.code, 500);
        assert.equal(res.content, `val必须大于2`);
    }


    it('koa route', function () {
        return testFunc(3001)
    });

    it('express route', function () {
        return testFunc(3002)
    });
});