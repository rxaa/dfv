import * as formidable from "formidable";
import {FileMultiple, IFieldRes, valid} from "../public/valid";
import {dfv, MapString} from "../public/dfv";
import * as fs from "fs";
import * as http from "http";
import {dfvContext} from "./dfvContext";
import {dfvLog} from "./dfvLog";


export interface IncomingFormParse {
    encoding: string;
    uploadDir: string;
    keepExtensions: boolean;
    //最大字段长度
    maxFieldsSize: number;
    maxFields: number;
    hash: string | boolean;
    multiples: boolean;
    type: string;
    bytesReceived: number;
    bytesExpected: number;

    //最大文件字节长度
    maxFileSize?: number;

    //文件开始下载前检测
    checkFile?: (name: string, file: FileMultiple) => boolean;

    //是否关闭文件上传严格模式，默认false(未在入参验证对象里指定的exp.file()的都不允许上传)
    disableStrict?: boolean;

    /**
     * 所有已上传文件
     */
    fileList?: FileMultiple[];

    fieldsMap: MapString<string | FileMultiple | any[]>;

    /**
     * 入参验证class实例
     */
    modReqInst: any;
}


export class dfvForm {


    /**
     * 解析并验证req请求参数
     * @param modClass
     * @param req
     * @returns {IFieldRes<any>}
     */
    static check(modClass: { new(): any; }, req: dfvContext): Promise<IFieldRes<any>> | IFieldRes<any> {
        let modInst = new modClass();

        let multipart = valid.getMultipart(modClass);
        if (!multipart) {
            req._dat = dfvContext.joinParams(req);
            return valid.checkObj(req._dat, modInst);
        }

        //解析文件
        let form = dfvForm.newForm(modInst);
        multipart(form);

        return dfvForm.parseModPromise(form, req).then(ret => {
            req._dat = ret;
            let check_data = valid.checkObj(ret, modInst);
            if (!check_data.ok)
                dfvForm.removeFileList(form);

            return check_data;
        });
    }


    /**
     * form表单数组最大索引限制
     */
    static maxArrayIndex = 100 * 1000;

    static newForm(modReqInst?: any) {
        let f = new formidable.IncomingForm() as formidable.IncomingForm & IncomingFormParse;
        if (modReqInst)
            f.modReqInst = modReqInst;
        return f;
    }

    static removeFileList(form: IncomingFormParse) {
        if (form.fileList) {
            (form.fileList as FileMultiple[]).forEach(it => fs.unlink(it.path, err => {
            }));
            delete form.fileList;
        }
    }


    static parseModPromise(form: formidable.IncomingForm & IncomingFormParse, ctx: dfvContext) {
        let req = dfvContext.getIncomingMessage(ctx);

        return new Promise((resolve, reject) => {

            let type = req.headers["content-type"] as string;
            if (!type || type.toLowerCase().indexOf("multipart/form-data") < 0) {
                reject(new Error("Content-Type必须为multipart/form-data"));
                return;
            }

            dfvForm.processFile(form)
            form.parse(req, (err, fields, files) => {
                if (err) {
                    dfvForm.removeFileList(form);
                    reject(err);
                    return;
                }

                ctx.multipart = {
                    fields: fields, files: files,
                }


                resolve(form.fieldsMap);
            });
        });
    }

    private static getFieldVal(pos: number, name: string, val: any, oldVal: any) {
        var subField: string = "";

        for (; pos < name.length; pos++) {
            var posStr = name[pos];

            if (posStr === ']') {

                if (subField.length == 0) {
                    if (val == null) {
                        val = [];
                    }
                    val.push(dfvForm.getFieldVal(pos + 1, name, null, oldVal))
                }
                else {
                    if (dfv.isInt(subField)) {
                        subField = parseInt(subField) as any;
                        if ((subField as any) < 0 || (subField as any) > dfvForm.maxArrayIndex) {
                            throw Error(name + "索引超范围:" + subField)
                        }
                        if (val == null)
                            val = [];
                    }
                    else {
                        if (val == null)
                            val = {};
                    }
                    val[subField] = dfvForm.getFieldVal(pos + 1, name, val[subField], oldVal);
                }

                return val;
            }


            if (posStr === ' ' || posStr === `'` || posStr === `"` || posStr === `[` || posStr === `\t`) {
                continue;
            }

            subField += posStr;

        }


        return oldVal;
    }


    private static processFile(form: formidable.IncomingForm & IncomingFormParse) {
        form.fileList = [];
        form.fieldsMap = {};
        let sizeCount = 0;
        let isFile = false;

        form.onPart = function (part) {

            part.on('data', (buf: Buffer) => {
                if (isFile) {
                    sizeCount += buf.length;
                    if (form.maxFileSize && sizeCount > form.maxFileSize) {
                        // throw new Error("文件不能大于:" + form.maxFileSize);
                        form.emit("error", new Error("文件不能大于:" + form.maxFileSize))
                    }
                }
            });

            try {
                form.handlePart(part);
            } catch (e) {
                form.emit("error", e)
            }
        }

        form.on('field', function (name: string, value: string) {
            try {
                let pos = name.indexOf("[");
                if (pos > 0) {
                    var fName = name.substr(0, pos);
                    if (!(form.modReqInst && valid.isFile(form.modReqInst[fName]))) {//排除文件
                        form.fieldsMap[fName] = dfvForm.getFieldVal(pos + 1, name, form.fieldsMap[fName], value);
                    }
                }
                else {
                    if (!(form.modReqInst && valid.isFile(form.modReqInst[name]))) {//排除文件
                        form.fieldsMap[name] = value;
                    }
                }
            } catch (e) {
                dfvLog.write("field name error:" + name, e);
            }
        });

        form.on('file', function (name: string, file: FileMultiple) {
            isFile = false;
            try {
                let pos = name.indexOf("[");
                if (pos > 0) {
                    var fName = name.substr(0, pos);
                    form.fieldsMap[fName] = dfvForm.getFieldVal(pos + 1, name, form.fieldsMap[fName], file);
                }
                else {
                    form.fieldsMap[name] = file;
                }
            } catch (e) {
                dfvLog.write("file name error:" + name, e);
            }
        });

        form.on('fileBegin', function (name: string, file: FileMultiple) {
            sizeCount = 0;
            isFile = true;
            if (form.fileList)
                form.fileList.push(file)

            if (!form.disableStrict && form.modReqInst) {

                let fieldName = name;
                let pos = name.indexOf("[");
                if (pos >= 0) {
                    fieldName = name.substr(0, pos);
                }

                if (!valid.isFile(form.modReqInst[fieldName])) {
                    throw new Error("错误的文件name:" + fieldName);
                    // form.emit("error", new Error("错误的文件name:" + name))
                    // return;
                }
            }

            if (form.checkFile) {
                if (!form.checkFile(name, file)) {
                    throw new Error("无效文件!");
                }
            }

        });

    }
}