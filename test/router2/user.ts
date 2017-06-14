import {dfvRouter} from "../../src/dfvRouter";

export =  (http: dfvRouter) => {

    http.all("/user2/get", null, async (ctx, dat) => {

        return "ok2"
    })

    http.all("/user2/get2", null, async (ctx, dat) => {

        throw Error("error")
    })
}