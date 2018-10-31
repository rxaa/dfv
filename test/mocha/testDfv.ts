import assert = require('assert');
import { dfvHttpClient, HttpCookie } from "../../src/dfvHttpClient";
import { array, ARRAY_TYPE, arrayNumber, arrayString, dfv } from "../../src/public/dfv";
import { FuncParse } from "../../src/FuncParse";
import * as fs from "fs";
import { dfvFile } from "../../src/dfvFile";
require("../../src/public/dfvFuncExt")
class testP {
    a = 2;
}


class testSub {
    c = 1;
}



function testParse(a: any, b: any = (aaaa: any, vvv: any) => {
}, c: any = "ss", d: any) {
    //注释
    let aaa = 1;

    /**
     * 注释2
     */
    aaa = (a + b);
    if (c === 1) {
        d = 2;
    }
    else
        c = "sas\"assa";

    return "sssss";
}


describe('sdf Test', function () {
    it("array type", async () => {
        let a = arrayString();
        let count = 0;
        for (let k in a) {
            count++;
        }
        assert.equal(count, 0);
        let type = a[ARRAY_TYPE];
        assert.equal(type, String);
        assert.equal(dfv.getArrayType(a), String);

        let an = arrayNumber();
        assert.equal(an[ARRAY_TYPE], Number);
        assert.equal(dfv.getArrayType(an), Number);

        let ao = array(testSub);
        assert.equal(ao[ARRAY_TYPE], testSub);
        assert.equal(dfv.getArrayType(ao), testSub);

        let s = "aaaa\r\nvvvvv\ndsdsd\rsdsdsdsds\ngfgfg\n\n"
        let s2 = "";
        let s3 = "\r\n";
        let strRes = "";
        dfv.readLine(s, line => { strRes += line + "-" });
        assert.equal(strRes, "aaaa-vvvvv-dsdsdsdsdsdsds-gfgfg--");
        strRes = "";
        dfv.readLine(s2, line => { strRes += line + "-" });
        assert.equal(strRes, "");
        strRes = "";
        dfv.readLine(s3, line => { strRes += line + "-" });
        assert.equal(strRes, "-");

    });


    it("dfvFile", async () => {
        let f1 = __dirname + "/../runtime/t1.txt";
        let f2 = f1 + ".txt";
        await dfvFile.writeFile(f1, "abcd");
        if (await dfvFile.exists(f2))
            await dfvFile.unlink(f2);
        await dfvFile.copyFile(f1, f2);
        let res = await dfvFile.readFile(f2);
        assert.equal("abcd", res);
    });

    it("http cookie", () => {

        let func = new FuncParse(testParse)

        var hc = new dfvHttpClient("https://www.baidu.com/");
        hc.resp = {
            headers: {
                "set-cookie": ["BDSVRTM=127; path=/",
                    "H_PS_PSSID=1441_21080_22917_20718; path=/; domain=.baidu.com",
                    "__bsi=9759887671903292193_00_783_N_N_129_0303_C02F_N_N_Y_0; expires=Tue, 30-May-17 04:36:56 GMT; domain=www.baidu.com; path=/",
                    "BD_HOME=1; path=/",
                ]
            }
        } as any
        let co = new HttpCookie();
        co.setCookies(hc.getHostName(), hc.resp!.headers);
        assert.equal(JSON.stringify(co.cookies), `{"www.baidu.com":{"BDSVRTM":"127","H_PS_PSSID":"1441_21080_22917_20718","__bsi":"9759887671903292193_00_783_N_N_129_0303_C02F_N_N_Y_0","BD_HOME":"1"},".baidu.com":{"H_PS_PSSID":"1441_21080_22917_20718"}}`);

        hc = new dfvHttpClient("https://www.baidu.com/");
        hc.header.setCookie(co.getCookisStr(hc.getHostName()))

        assert.equal(hc.getHeaders()["Cookie"], `BDSVRTM=127; H_PS_PSSID=1441_21080_22917_20718; __bsi=9759887671903292193_00_783_N_N_129_0303_C02F_N_N_Y_0; BD_HOME=1`);

    });


    it("matchSuffiix", () => {
        let a = 10;
        let b = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let c = 0;
        a.loop(i => {
            assert.equal(i, b[i]);
            c++;
        })


        assert.equal(c, a);
        let res = a.loopMap(i => i);
        assert.equal(JSON.stringify(b), JSON.stringify(res));

        res = Number(10).loopMap(i => i);
        assert.equal(JSON.stringify(b), JSON.stringify(res));
        assert.equal(dfv.getFileName("dddd/dsds/233/jj.abc"), "jj.abc");
        assert.equal(dfv.getFileName("ddddjj.abc"), "");
        assert.equal(dfv.getFileName("/ddddjj.abc"), "ddddjj.abc");
    })


    it("mapString", () => {
        let a = [1, 2, 3, 4];
        assert.equal(a.mapString(r => r), "1234");
    })


    it("binarySearch", () => {
        let a = [1, 2, 3, 4];
        assert.equal(a.binarySearch(r => 0 - r), -1);
        assert.equal(a.binarySearch(r => 1 - r), 0);
        assert.equal(a.binarySearch(r => 2 - r), 1);
        assert.equal(a.binarySearch(r => 3 - r), 2);
        assert.equal(a.binarySearch(r => 4 - r), 3);
        assert.equal(a.binarySearch(r => 5 - r), -1);

        a = [1, 2, 3];
        assert.equal(a.binarySearch(r => 0 - r), -1);
        assert.equal(a.binarySearch(r => 1 - r), 0);
        assert.equal(a.binarySearch(r => 2 - r), 1);
        assert.equal(a.binarySearch(r => 3 - r), 2);
        assert.equal(a.binarySearch(r => 4 - r), -1);
        assert.equal(a.binarySearch(r => 5 - r), -1);

        a = [1, 2];
        assert.equal(a.binarySearch(r => 0 - r), -1);
        assert.equal(a.binarySearch(r => 1 - r), 0);
        assert.equal(a.binarySearch(r => 2 - r), 1);
        assert.equal(a.binarySearch(r => 3 - r), -1);
        assert.equal(a.binarySearch(r => 4 - r), -1);
        assert.equal(a.binarySearch(r => 5 - r), -1);

        a = [1];
        assert.equal(a.binarySearch(r => 0 - r), -1);
        assert.equal(a.binarySearch(r => 1 - r), 0);
        assert.equal(a.binarySearch(r => 2 - r), -1);
        assert.equal(a.binarySearch(r => 3 - r), -1);
        assert.equal(a.binarySearch(r => 4 - r), -1);
        assert.equal(a.binarySearch(r => 5 - r), -1);

        a = [];
        assert.equal(a.binarySearch(r => 0 - r), -1);
        assert.equal(a.binarySearch(r => 1 - r), -1);
        assert.equal(a.binarySearch(r => 2 - r), -1);
        assert.equal(a.binarySearch(r => 3 - r), -1);
        assert.equal(a.binarySearch(r => 4 - r), -1);
        assert.equal(a.binarySearch(r => 5 - r), -1);

        let b = [{ a: "1" }, { a: "2" }, { a: "3" }];

        assert.equal(b.binarySearch(r => "1".localeCompare(r.a)), 0);
        assert.equal(b.binarySearch(r => "2".localeCompare(r.a)), 1);
        assert.equal(b.binarySearch(r => "3".localeCompare(r.a)), 2);
        assert.equal(b.binarySearch(r => "aa".localeCompare(r.a)), -1);

    });

    it("toap", () => {
        let a = [1, 2, 3];
        let b1 = dfv.arrToMap(a, ot => ot);
        assert.equal(JSON.stringify(b1), `{"1":1,"2":2,"3":3}`);
        let b2 = dfv.mapToArr(b1);
        assert.equal(JSON.stringify(b2), `[1,2,3]`);
    });

    it("test", () => {
        assert.equal(dfv.isInt("123"), true);
        assert.equal(dfv.isInt("01230"), true);
        assert.equal(dfv.isInt("-123"), false);
        assert.equal(dfv.isInt(""), false);
        assert.equal(dfv.isInt("212.22"), false);
        assert.equal(dfv.isInt("asas2323"), false);
        assert.equal(dfv.isInt("3232sdsd"), false);
    });


    it("meta parent", () => {
        let e = new testSub();


        dfv.setParent(e.constructor, testP)


        let ps = dfv.getParent(e.constructor);

        assert.equal(ps.length, 1)
        assert.equal(ps[0], testP)

        dfv.setParent(e.constructor, testSub)
        ps = dfv.getParent(e.constructor);
        assert.equal(ps.length, 3)
        assert.equal(ps[0], testP)
        assert.equal(ps[2], testSub)


    })

    it("mapPromie", async () => {

        let a = [1, 2, 3, 4, 5];
        let b = await a.mapPromise(async (it) => it);


        assert.equal(JSON.stringify(a), JSON.stringify(b))
    })


    it('leftJoin', function () {
        let m = [
            {
                id: 1,
                name: "abc",
            },
            {
                id: 1,
                name: "abc22222222",
            },
            {
                id: 2,
                val: 0,
                name: "aaa",
            },
            {
                id: 3,
                name: "bbb",
            },
        ]

        let r = [
            {
                id: 2,
                val: 1,
                aa: "2222",
            },
            {
                id: 3,
                aa: "33333",
            },
        ];
        let res = [
            {
                id: 1,
                name: "abc",
            },
            {
                id: 1,
                name: "abc22222222",
            },
            {
                id: 2,
                val: 0,
                name: "aaa",
                aa: "2222",
            },
            {
                id: 3,
                name: "bbb",
                aa: "33333",
            },
        ];

        let join = dfv.leftJoin(m, r, l => l.id, r => r.id);
        assert.equal(JSON.stringify(res), JSON.stringify(join));

    });


    it("leftJoin override", () => {
        let m = [
            {
                id: 1,
                name: "abc",
            },
            {
                id: 1,
                name: "abc22222222",
            },
            {
                id: 2,
                val: 0,
                name: "aaa",
            },
            {
                id: 3,
                name: "bbb",
            },
        ]

        let r = [
            {
                id: 2,
                val: 1,
                aa: "2222",
            },
            {
                id: 3,
                aa: "33333",
            },
        ];
        let res = [
            {
                id: 1,
                name: "abc",
            },
            {
                id: 1,
                name: "abc22222222",
            },
            {
                id: 2,
                val: 1,
                name: "aaa",
                aa: "2222",
            },
            {
                id: 3,
                name: "bbb",
                aa: "33333",
            },
        ];

        let join = dfv.leftJoin(m, r, l => l.id, r => r.id, true);
        assert.equal(JSON.stringify(res), JSON.stringify(join));
    });


    it("joinObj2", () => {
        let l = {
            a: 1,
            b: 2,
            c: "3",
        }

        let r = {
            a: 22,
            d: 4,
            e: 5,
            f: "6",
        }

        let res = {
            a: 22,
            b: 2,
            c: "3",
            d: 4,
            e: 5,
            f: "6",
        };

        let r3 = {
            g: 3,
            dd: 3,
        }
        let res2 = {
            a: 22,
            b: 2,
            c: "3",
            d: 4,
            e: 5,
            f: "6",
            g: 3,
            dd: 3,
        };

        assert.equal(JSON.stringify(dfv.joinObj(l, r)), JSON.stringify(res))
        assert.equal(JSON.stringify(dfv.joinObjFast({}, l, r, r3)), JSON.stringify(res2))
    });
});