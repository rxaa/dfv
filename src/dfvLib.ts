import * as crypto from "crypto";
import {dfv} from "./public/dfv";

export class PreciseTime {
    constructor(private time: [number, number]) {

    }


    /**
     * 获取纳秒差
     * @returns {number}
     */
    getNano() {
        let diff = process.hrtime(this.time);
        return diff[0] * 1e9 + diff[1];
    }

    /**
     * 获取微妙差
     */
    getMicro() {
        let diff = process.hrtime(this.time);
        return diff[0] * 1e6 + diff[1] / 1e3;
    }

    /**
     * 获取毫秒差
     */
    getMilli() {
        let diff = process.hrtime(this.time);
        return diff[0] * 1e3 + diff[1] / 1e6;
    }
}

export class dfvLib {

    /**
     * 初始化：指定项目根目录，source-map-support，加载扩展函数
     * @param root
     */
    static init(root: string) {
        dfv.root = root;
        require('source-map-support').install();
        require("./public/dfvFuncExt");
    }

    /**
     * 获取当前纳秒
     * @returns {PreciseTime}
     */
    static getPreciseTime() {
        return new PreciseTime(process.hrtime());
    }


    static md5(val: string): string {
        let hash = crypto.createHash('md5');
        hash.update(val);
        return hash.digest('hex');
    }

    static sha1(val: string): string {
        let hash = crypto.createHash('sha1');
        hash.update(val);
        return hash.digest('hex');
    }

    static sha256(val: string): string {
        let hash = crypto.createHash('sha256');
        hash.update(val);
        return hash.digest('hex');
    }

    static dateDir() {
        let d = new Date();
        return "/" + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
    }


}