"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const dfvHttpClient_1 = require("../../src/dfvHttpClient");
require("../koa");
require("../express");
describe('router Test', function () {
    const testFunc = (port) => __awaiter(this, void 0, void 0, function* () {
        let ht = new dfvHttpClient_1.dfvHttpClient(`http://localhost:${port}/user/test1-333?name=abc&val=3`);
        let res = yield ht.get();
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":333,"name":"abc","val":3}`);
        ht.setUrl(`http://localhost:${port}/user/test1-444?id=2&name=ttt&val=5`);
        res = yield ht.get();
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":444,"name":"ttt","val":5}`);
        ht.setUrl(`http://localhost:${port}/user/test1-444?name=ttt&val=2`);
        res = yield ht.get();
        assert.equal(res.code, 500);
        assert.equal(res.content, `val必须大于2`);
        ht.setUrl(`http://localhost:${port}/user/test1-444?name=ttt&val=2`);
        res = yield ht.get();
        assert.equal(res.code, 500);
        assert.equal(res.content, `val必须大于2`);
        ht.setUrl(`http://localhost:${port}/user/test2-444?id=2&name=ttt`);
        res = yield ht.header.setJson().post(`{"val":66}`);
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":444,"name":"ttt","val":66}`);
        ht.setUrl(`http://localhost:${port}/user/test2-444?id=2&name=ttt`);
        res = yield ht.header.setForm().post(`val=666`);
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":444,"name":"ttt","val":666}`);
        ht.setUrl(`http://localhost:${port}/user/test3?id=2&name=ttt`);
        res = yield ht.header.setForm().post(`val=666`);
        assert.equal(res.code, 200);
        assert.equal(res.content, `{"id":2,"name":"ttt","val":666}`);
        ht.setUrl(`http://localhost:${port}/user/test3?id=2&name=ttt`);
        res = yield ht.header.setForm().post(`val=2`);
        assert.equal(res.code, 500);
        assert.equal(res.content, `val必须大于2`);
    });
    it('koa route', function () {
        return testFunc(3001);
    });
    it('express route', function () {
        return testFunc(3002);
    });
});
//# sourceMappingURL=testRouter.js.map