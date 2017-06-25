import {dfvContext} from "../../src/dfvContext";
import {valid} from "../../public/valid";
import {TestReq2} from "../models/TestReq1";
import {route} from "../../src/control/route";
import {ExpressCtx, KoaCtx} from "../ICtx";
import {dfv} from "../../public/dfv";

@route.path("")
export class HomeController {
    ctx: ExpressCtx;


    @route.get("/")
    async index(@valid.int()aa: number, @route.fromUrl ss: TestReq2) {

        return aa + " - " + JSON.stringify(ss);
    }


    @route.get()
    async test1() {
        return "test1";
    }

    @route.get()
    async test2(id: string) {

        return "test2:" + id;
    }

    @route.post()
    @route.multipart(form => {
        form.uploadDir = dfv.getTemp();
        form.maxFileSize = 10 * 1024 * 1024;//10mb
    })
    async test3(id: string) {

        return "test2:" + id;
    }
}