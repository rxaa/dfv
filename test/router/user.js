"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const TestReq1_1 = require("../models/TestReq1");
const db_1 = require("../db");
module.exports = (http) => {
    http.all("/user/get", null, (ctx, dat) => {
        return "ok";
    });
    http.all("/user/get2", null, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        throw Error("error");
    }));
    http.get("/user/test1-:id", TestReq1_1.TestReq1, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        return dat;
    }));
    http.post("/user/test2-:id", TestReq1_1.TestReq1, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        return dat;
    }));
    http.all("/user/test3", TestReq1_1.TestReq1, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        return dat;
    }));
    http.all("/mysql/test1", null, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        let ret = Array();
        try {
            yield db_1.db.mysql.queryEach("select * from rb_sort", (row) => {
                ret.push(row);
                throw Error("错误");
            });
        }
        catch (e) {
            console.error(e);
        }
        return ret;
    }));
    http.all("/mysql/test2", null, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        let ret = yield db_1.db.mysql.queryPromise("select * from rb_sort limit 100");
        return ret;
    }));
    http.all("/test", null, (ctx, dat) => __awaiter(this, void 0, void 0, function* () {
        return `
            <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
                <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
                <title>
                   test
                </title>
                <link rel="stylesheet" href="/style.css"/>
                <link rel="stylesheet" href="/icon.css"/>
                <script src="/promise.amd.min.js"></script>
                <script src="/all.js"></script>
               
                <script>window.define=void 0</script>
             </head>
             <body></body>
              <script>Front.init()</script>
             </html>
        `;
    }));
};
//# sourceMappingURL=user.js.map