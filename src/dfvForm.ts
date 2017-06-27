import * as formidable from "formidable";
import {FileMultiple, IFieldRes, IncomingFormParse} from "./public/valid";
import {dfv} from "./public/dfv";
import * as fs from "fs";
import {dfvLog} from "./dfvLog";
import {dfvRouter} from "./control/dfvRouter";
import {dfvContext} from "./dfvContext";
import {dfvFile} from "./dfvFile";


export class dfvForm {


    /**
     * form表单数组最大索引限制
     */
    static maxArrayIndex = 100 * 1000;

    static newForm() {
        let f = new formidable.IncomingForm() as formidable.IncomingForm & IncomingFormParse;
        f.multipart = {fields: {}, files: {}}
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
        let req = dfvRouter.getIncomingMessage(ctx);

        return new Promise<void>((resolve, reject) => {

            let type = req.headers["content-type"] as string;
            if (!type || type.toLowerCase().indexOf("multipart/form-data") < 0) {
                reject(dfv.err("Content-Type must be : multipart/form-data"));
                return;
            }

            let parseFunc = () => {
                dfvForm.processFile(form)
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        dfvForm.removeFileList(form);
                        reject(err);
                        return;
                    }

                    ctx.multipart = form.multipart;

                    resolve();
                });
            }

            if (form.uploadDir) {
                dfvFile.exists(form.uploadDir)
                    .then(exists => {
                        if (!exists)
                            return dfvFile.mkdirs(form.uploadDir);

                        return void 0;
                    })
                    .then(() => {
                        parseFunc();
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
            else {
                parseFunc();
            }


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
                            dfv.err(name + "index out of range : " + subField)
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
        let sizeCount = 0;
        let isFile = false;
        form.onPart = function (part) {

            part.on('data', (buf: Buffer) => {
                if (isFile) {
                    sizeCount += buf.length;
                    console.log("data:" + buf.length);
                    if (form.maxFileSize && sizeCount > form.maxFileSize) {
                        form.emit("error", dfv.err("file size can not greater than : " + form.maxFileSize))
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
                    form.multipart.fields[fName] = dfvForm.getFieldVal(pos + 1, name, form.multipart.fields[fName], value);
                }
                else {
                    form.multipart.fields[name] = value;
                }
            } catch (e) {
                dfvLog.write("field name error:" + name, e);
            }
        });

        form.on('file', function (name: string, file: FileMultiple) {
            if (form.maxFileSize && file.size > form.maxFileSize) {
                form.emit("error", dfv.err("file size can not greater than : " + form.maxFileSize))
            }
            isFile = false;
            try {
                let pos = name.indexOf("[");
                if (pos > 0) {
                    var fName = name.substr(0, pos);
                    form.multipart.files[fName] = dfvForm.getFieldVal(pos + 1, name, form.multipart.files[fName], file);
                }
                else {
                    form.multipart.files[name] = file;
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

            if (form.checkFile) {
                if (!form.checkFile(name, file)) {
                    throw dfv.err("invalid file:" + name);
                }
            }

        });

    }
}