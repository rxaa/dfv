import {dfvRouter} from "../../src/dfvRouter";
import {TestReq1} from "../models/TestReq1";
import {db} from "../db";

export =  (http: dfvRouter) => {

    http.all("/user/get", null, (ctx, dat) => {

        return "ok"
    })

    http.all("/user/get2", null, async (ctx, dat) => {

        throw Error("error")
    })


    http.get("/user/test1-:id", TestReq1, async (ctx, dat) => {
        return dat;
    })

    http.post("/user/test2-:id", TestReq1, async (ctx, dat) => {
        return dat;
    })

    http.all("/user/test3", TestReq1, async (ctx, dat) => {
        return dat;
    })

    http.all("/mysql/test1", null, async (ctx, dat) => {
        let ret = Array();
        try {
            await db.mysql.queryEach("select * from rb_sort", (row) => {
                ret.push(row)
                throw Error("错误")
            })
        } catch (e) {
            console.error(e)
        }
        return ret;
    })

    http.all("/mysql/test2", null, async (ctx, dat) => {
        let ret = await db.mysql.queryPromise("select * from rb_sort limit 100")
        return ret;
    })

    http.all("/test", null, async (ctx, dat) => {
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
    })
}