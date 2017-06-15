import * as http from "http";
import * as formidable from "formidable";
import {dfv} from "../public/dfv";


export class dfvContext {
    /**
     * response 状态吗
     */
    status = 0;

    /**
     * response content内容
     */
    body: any;

    /**
     *url paras，query,body三者合并结果
     */
    _dat: any;

    /**
     * 用于判断该context来自koa还是express
     */
    isKoa = true;

    /**
     * 解析multipart/form-data时产生的属性
     */
    multipart: { fields: formidable.Fields, files: formidable.Files }


    static getIncomingMessage(cont: dfvContext): http.IncomingMessage {
        return cont.isKoa ? (cont as any).req : (cont as any).request;
    }


    /**
     * 合并url paras，query,body
     * @param ctx
     */
    static joinParams(ctx: dfvContext) {
        let req = (ctx as any).request;
        if (req.method == "POST") {
            dfv.joinObjFast(req.body, req.query, req.params)
            return req.body;
        }
        else {
            dfv.joinObjFast(req.query, req.params);
            return req.query;
        }
    }
}