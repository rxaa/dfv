import {dfvRouter} from "../../src/dfvRouter";

export =  (http: dfvRouter) => {

    http.all("/user/get", null, async (ctx, dat) => {

        return "ok"
    })

    http.all("/user/get2", null, async (ctx, dat) => {

        throw Error("error")
    })
}