import {dfv, MapString} from "../public/dfv";
import {dfvLog} from "./dfvLog";
export class dfvTime {
    static timeMap: MapString<NodeJS.Timer> = {};
    lastExecTime = new Date();
    func: (() => (void | Promise<void>)) | null = null;
    id: number = dfvTime.incEventId++;

    private static incEventId = 0;
    private static eventMap = new Map<number, dfvTime>();

    /**
     * 开始执行定时事件
     */
    start() {
        dfvTime.set(this);
    }

    /**
     * 暂停执行
     */
    stop() {
        dfvTime.remove(this);
    }

    private static init() {
        setTimeout(dfvTime.eventLoop, 20 * 1000);
    }

    /**
     * 循环事件
     * @param intervalTime 事件执行的时间间隔(毫秒)
     * @param func
     */
    static intervalEvent(intervalTime: number, func: (e: dfvTime)=>(void|Promise<void>)) {
        let ev = new dfvTime();
        ev.func = ()=> {
            if (Date.now() > ev.lastExecTime.getTime() + intervalTime) {
                ev.lastExecTime = new Date();
                func(ev);
            }
        }

        return ev;
    }


    /**
     * 每日事件
     * @param hours 每日事件执行的时间(时,分)
     * @param minutes
     * @param func
     */
    static dailyEvent(hours: number, minutes: number, func: (e: dfvTime)=>(void|Promise<void>)) {
        let ev = new dfvTime();
        ev.func = ()=> {
            var now = new Date();
            // var h = ev.lastExecTime.getDate();
            if (ev.lastExecTime.getDate() != now.getDate() && now.getHours() >= hours && now.getMinutes() >= minutes) {
                ev.lastExecTime = new Date();
                func(ev);
            }
        }

        return ev;
    }

    private static isStart = false;


    /**
     * 设置定时时间
     * @param event
     */
    static set(event: dfvTime) {
        if (!dfvTime.isStart) {
            dfvTime.init();
            dfvTime.isStart = true;
        }

        dfvTime.eventMap.set(event.id, event);
    }

    static remove(event: dfvTime) {
        dfvTime.eventMap.delete(event.id);
    }

    private static eventLoop() {
        for (var m of dfvTime.eventMap) {
            var k = m[0];
            var v = m[1];

            try {
                if (v.func)
                    v.func();
            } catch (e) {
                dfvLog.err(e);
            }
        }
        dfvTime.init();
    }


    /**
     * 添加延时事件
     * @param time 延时,毫秒
     * @param func 普通函数或async函数
     * @returns {string}事件id
     */
    static addTimeOut(time: number, func: () => (void | Promise<void>)): string {
        let id = dfv.getUniqueId();
        let t = setTimeout(() => {

            try {
                var ret = <Promise<void>>func();

                if (ret instanceof Promise) {
                    ret.then(() => {
                        // console.error("Promise then");
                        delete dfvTime.timeMap[id];
                    }).catch(e => {
                        delete dfvTime.timeMap[id];
                        dfvLog.write("TimeOut Promise", e);
                    });
                }
                else {
                    delete dfvTime.timeMap[id];
                }
            } catch (e) {
                delete dfvTime.timeMap[id];
                dfvLog.write("TimeOut Exception", e);
            }

        }, time);
        dfvTime.timeMap[id] = t;
        return id;
    }

    static removeTimeOut(id: string): boolean {
        let t = dfvTime.timeMap[id];
        if (t) {
            clearTimeout(t);
            delete dfvTime.timeMap[id];
            return true;
        }
        return false;
    }
}