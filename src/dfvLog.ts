import { dfv } from "./public/dfv";
import * as fs from "fs";
import * as path from "path";
import { dfvFile } from "./dfvFile";
export class dfvLog {

    /**
     * 日志目录
     * @type {string}
     */
    static menuGet = () => dfv.root + "/runtime/logs";

    /**
     * 开启日志文件
     * @type {boolean}
     */
    static enableFile = true;

    /**
     * 开启控制台提示
     * @type {boolean}
     */
    static enableConsole = true;


    /**
     * 将Error写入日志
     * @param err
     */
    static err(err: Error) {
        dfvLog.write(null, err);
    }


    /**
     * 获取日志目录
     * @returns {string}
     */
    static getErrorLogFile = () => dfvLog.getCutFile("error.log");


    static getCutFile(name: string) {
        let d = new Date();
        return dfvLog.menuGet() + "/" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + name;
    }


    /**
     * 将字串与Error写入文件
     * @param str
     * @param err
     * @param logFile 可选，指定文件名
     */
    static write(str: string | null, err?: Error | null, logFile?: string) {

        if (!logFile)
            logFile = dfvLog.getErrorLogFile();

        if (dfvLog.enableConsole) {
            if (str)
                console.info("[" + dfv.dateToY_M_D_H_M_S(new Date()) + "]\r\n" + str);
            else
                console.info("[" + dfv.dateToY_M_D_H_M_S(new Date()) + "]");

            if (err)
                console.error(err.stack);
        }

        if (dfvLog.enableFile) {
            try {
                let logStr = "[" + dfv.dateToY_M_D_H_M_S(new Date()) + "]\r\n"

                if (str)
                    logStr += str + "\r\n\r\n"

                if (err) {
                    logStr += err.stack + "\r\n\r\n";
                }

                fs.appendFile(logFile, logStr, e => {
                    if (e && e.code == "ENOENT") {
                        dfvFile.mkdirs(path.parse(logFile!).dir).then(() => {
                            fs.appendFile(logFile!, logStr, e => {

                            });
                        })
                    }
                });

            } catch (e) {
            }
        }
    }
}