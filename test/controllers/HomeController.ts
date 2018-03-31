import { valid } from "../../src/public/valid";
import { TestReq2 } from "../models/TestReq1";
import { route } from "../../src/control/route";
import { ExpressCtx, KoaCtx } from "../ICtx";
import { dfv } from "../../src/public/dfv";
import { TestFile, TestFile2 } from "../models/TestFile";

@route.path("")
export class HomeController {
    ctx!: ExpressCtx;
    ctx2!: KoaCtx;

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
    async upload(dat: TestFile) {
        return dat;
    }

    @route.post()
    @route.multipart(form => {
        form.uploadDir = dfv.getTemp();
        form.maxFileSize = 10 * 1024 * 1024;//10mb
    })
    async upload2(dat: TestFile2) {
        return dat;
    }

    @route.get()
    async testFile(id: string) {

        return '<form action="/upload" enctype="multipart/form-data" method="post">' +
            '<input type="text" name="title"><br>' +
            '<input type="file" name="upload" multiple="multiple"><br>' +
            '<input type="file" name="file2" multiple="multiple"><br>' +
            '<input type="submit" value="Upload">' +
            '</form>'
    }

    @route.get()
    async testFile2(id: string) {

        return '<form action="/upload2" enctype="multipart/form-data" method="post">' +
            '<input type="text" name="title[0][asss]"><br>' +
            '<input type="text" name="title[1][ssss]"><br>' +
            '<input type="file" name="upload[]" multiple="multiple"><br>' +
            '<input type="file" name="upload[]" multiple="multiple"><br>' +
            '<input type="submit" value="Upload">' +
            '</form>'
    }
}