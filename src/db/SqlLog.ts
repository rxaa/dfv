import { dfvLog } from "../dfvLog";
export class SqlLog {

    static write(str: string, err?: Error | null) {
        let d = new Date();
        let menu = dfvLog.menuGet() + "/sql/" + d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + ".log";
        dfvLog.write(str, err, menu);
    }
}
