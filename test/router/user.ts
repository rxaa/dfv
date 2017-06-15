import {dfvRouter} from "../../src/dfvRouter";
import {TestReq1} from "../models/TestReq1";

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
}