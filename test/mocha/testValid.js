"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const valid_1 = require("../../src/public/valid");
const dfv_1 = require("../../src/public/dfv");
const dfvBind_1 = require("../../src/public/dfvBind");
class ReqTest {
    constructor() {
        this.id = 1;
        this.val = "2";
        this.aaa = 0;
        this.bbb = "b";
    }
}
__decorate([
    valid_1.valid.int(r => r.val > 0, "aaa必须大于0"),
    __metadata("design:type", Object)
], ReqTest.prototype, "aaa", void 0);
__decorate([
    valid_1.valid.string(/^123$/, "bbb错误"),
    __metadata("design:type", Object)
], ReqTest.prototype, "bbb", void 0);
class NotVaild {
}
class ReqTest5 {
    constructor() {
        this.id = 1;
        this.val = "2";
        this.aaa = 0;
        this.bbb = "b";
        this.ccc = {
            a: 1,
            b: 2,
        };
    }
}
__decorate([
    valid_1.valid.int(r => r.val > 0, "aaa必须大于0"),
    __metadata("design:type", Object)
], ReqTest5.prototype, "aaa", void 0);
__decorate([
    valid_1.valid.string(),
    __metadata("design:type", Object)
], ReqTest5.prototype, "bbb", void 0);
class ReqTest2 {
    constructor() {
        this.id = 1;
        this.val = "2";
        this.aaa = 0;
        this.bbb = "b";
    }
}
__decorate([
    valid_1.valid.int(r => r.val > 0, "aaa必须大于0"),
    __metadata("design:type", Object)
], ReqTest2.prototype, "aaa", void 0);
__decorate([
    valid_1.valid.string(),
    __metadata("design:type", Object)
], ReqTest2.prototype, "bbb", void 0);
class ReqSub extends ReqTest2 {
    constructor() {
        super(...arguments);
        this.abcs = "";
    }
}
class ReqTest3 {
    constructor() {
        this.id = 1;
        this.val = "2";
        this.bbb = new ReqTest2();
    }
}
class ReqTest4 {
    constructor() {
        this.id = 1;
        this.val = "2";
        this.bbb = new ReqTest2();
    }
}
__decorate([
    valid_1.valid.object(r => r.val.bbb.length > 0, "bbb.bbb 不能为空"),
    __metadata("design:type", Object)
], ReqTest4.prototype, "bbb", void 0);
class ReqTest6 {
    constructor() {
        this.id = [1, 2];
    }
}
class ArrayTest {
    constructor() {
        this.bbb = [];
        this.cccc = [];
        this.ddd = [];
    }
}
__decorate([
    valid_1.valid.array(r => r.val.eachToInt()),
    __metadata("design:type", Object)
], ArrayTest.prototype, "bbb", void 0);
__decorate([
    valid_1.valid.array(r => r.val.eachToString()),
    __metadata("design:type", Object)
], ArrayTest.prototype, "cccc", void 0);
__decorate([
    valid_1.valid.array(r => r.val.eachToObj(ReqTest2)),
    __metadata("design:type", Array)
], ArrayTest.prototype, "ddd", void 0);
describe('valid Test', function () {
    it('valid route array入参验证', function () {
        let aa = 1;
        var f = (a = 1, b = dfv_1.dfv.getRandFixNum(aa), c = 3) => {
        };
        assert.deepEqual(dfv_1.dfv.getParameterNames(f), ['a', 'b', 'c']);
        let notRes = valid_1.valid.checkObj({
            bbb: [],
            cccc: [],
            ddd: [],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        notRes = valid_1.valid.checkObj({
            bbb: null,
            cccc: [],
            ddd: [],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        assert.equal(JSON.stringify(notRes.val), `{\"bbb\":[],\"cccc\":[],\"ddd\":[]}`);
        notRes = valid_1.valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        assert.equal(JSON.stringify(notRes.val), `{"bbb":[22,11,33],"cccc":["1","2","3"],"ddd":[]}`);
        notRes = valid_1.valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [new ReqTest2()],
        }, new ArrayTest());
        assert.equal(notRes.ok, false);
        assert.equal(notRes.msg, "ddd" + valid_1.valid.errMsg_);
        notRes = valid_1.valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [1],
        }, new ArrayTest());
        assert.equal(notRes.ok, false);
        assert.equal(notRes.msg, "ddd" + valid_1.valid.errMsg_);
        let req = new ReqTest2();
        req.aaa = 2;
        notRes = valid_1.valid.checkObj({
            bbb: ["22", "11.1", 33],
            cccc: [1, 2, "3"],
            ddd: [req, req],
        }, new ArrayTest());
        assert.equal(notRes.ok, true);
        assert.equal(JSON.stringify(notRes.val), `{"bbb":[22,11,33],"cccc":["1","2","3"],"ddd":[{"id":1,"val":"2","aaa":2,"bbb":"b"},{"id":1,"val":"2","aaa":2,"bbb":"b"}]}`);
    });
    it('valid route 入参验证', async function () {
        let notRes = valid_1.valid.checkObj({}, new NotVaild());
        assert.equal(notRes.ok, true);
        let res = valid_1.valid.checkObj({
            aaa: 2,
            bbb: "123",
        }, new ReqTest());
        assert.equal(res.ok, true);
        assert.equal(res.val.id, 1);
        assert.equal(res.val.val, "2");
        res = valid_1.valid.checkObj({
            aaa: 2,
            bbb: "aaa",
        }, new ReqTest());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "bbb错误");
        res = valid_1.valid.checkObj({
            aaa: 0,
            bbb: "123",
        }, new ReqTest());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "aaa必须大于0");
        res = valid_1.valid.checkObj({
            aaa: 1,
        }, new ReqTest2());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "bbb" + valid_1.valid.errMsg_);
        let re2 = valid_1.valid.checkObj({
            bbb: {
                aaa: 10,
                bbb: "123",
            }
        }, new ReqTest3());
        assert.equal(re2.ok, true);
        re2 = valid_1.valid.checkObj({
            bbb: {
                aaa: 0,
                bbb: "123",
            }
        }, new ReqTest3());
        assert.equal(re2.ok, false);
        assert.equal(re2.msg, "aaa必须大于0");
        re2 = valid_1.valid.checkObj({
            bbb: {}
        }, new ReqTest3());
        assert.equal(re2.ok, false);
        assert.equal(re2.msg, "aaa必须大于0");
        re2 = valid_1.valid.checkObj({
            bbb: {
                aaa: 1,
                bbb: "",
            }
        }, new ReqTest4());
        assert.equal(re2.ok, false);
        assert.equal(re2.msg, "bbb.bbb 不能为空");
        re2 = valid_1.valid.checkObj({
            bbb: {
                aaa: 1,
                bbb: "1",
            }
        }, new ReqTest4());
        assert.equal(re2.ok, true);
        res = valid_1.valid.checkObj({
            aaa: 1,
        }, new ReqSub());
        assert.equal(res.ok, false);
        assert.equal(res.msg, "bbb" + valid_1.valid.errMsg_);
        res = valid_1.valid.checkObj({
            aaa: 1,
            bbb: "",
        }, new ReqSub());
        assert.equal(res.ok, true);
        let rrr = valid_1.valid.checkObj({
            id: [1, 2, 3]
        }, new ReqTest6);
        assert.equal(res.ok, true);
        assert.equal(JSON.stringify(rrr.val), "{\"id\":[1,2,3]}");
        rrr = valid_1.valid.checkObj({
            id: 123
        }, new ReqTest6);
        assert.equal(res.ok, true);
        assert.equal(JSON.stringify(rrr.val), `{"id":[1,2]}`);
        let bi = dfvBind_1.dfvBind(e => true, { onSet: val => val });
        assert.equal(await bi.onSet(1, bi, {}), 1);
        bi = dfvBind_1.dfvBind(e => true, { onSet: async (val) => val });
        assert.equal(await bi.onSet(2, bi, {}), 2);
    });
});
//# sourceMappingURL=testValid.js.map