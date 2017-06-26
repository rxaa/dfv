import {dfvContext} from "../../src/dfvContext";
import {valid} from "../../src/public/valid";
import {TestReq2} from "../models/TestReq1";
import {route} from "../../src/control/route";
import {ExpressCtx, KoaCtx} from "../ICtx";
import {dfv} from "../../src/public/dfv";

@route.path("")
export class HomeController {
    ctx: ExpressCtx;
    ctx2: KoaCtx;

    @route.get("/")
    async index(@valid.int() aa: number, @route.fromUrl ss: TestReq2) {

        return aa + " - " + JSON.stringify(ss);
    }


    @route.get()
    async test() {
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