import * as fs from "fs";
import * as path from "path";
import {dfv} from "../public/dfv";

export class dfvFile {


    /**
     * 递归创建目录
     * @param dirname
     * @param mode
     * @returns {boolean}
     */
    static mkdirs(dirname: string, mode?: string | number): Promise<void> {
        return dfvFile.exists(dirname).then(res => {
            if (res)
                return;

            return dfvFile.mkdirs(path.dirname(dirname), mode)
                .then(() => dfvFile.mkdir(dirname, mode));
        });
    }


    /**
     * 递归删除目录
     * @param path
     * @param delMenu
     */
    static async deleteFolderRecursive(path: string, delMenu?: boolean) {
        if (await dfvFile.exists(path)) {
            var files = await dfvFile.readdir(path);

            for (let file of files) {
                var curPath = path + "/" + file;
                var st = await dfvFile.stat(curPath);
                if (st.isDirectory()) { // recurse
                    await dfvFile.deleteFolderRecursive(curPath, true);
                } else { // delete file
                    await dfvFile.unlink(curPath);
                }
            }

            if (delMenu)
                await dfvFile.rmdir(path);
        }
    };

    static readdir(path: string | Buffer) {
        return new Promise<string[]>((reso, reject) =>
            fs.readdir(path, (err, res) => err ? reject(err) : reso(res)));
    }

    static stat(path: string | Buffer) {
        return new Promise<fs.Stats>((reso, reject) =>
            fs.stat(path, (err, res) => err ? reject(err) : reso(res)));
    }

    static lstat(path: string | Buffer) {
        return new Promise<fs.Stats>((reso, reject) =>
            fs.lstat(path, (err, res) => err ? reject(err) : reso(res)));
    }

    static rename(oldPath: string, newPath: string) {
        return new Promise<void>((reso, reject) =>
            fs.rename(oldPath, newPath, err => err ? reject(err) : reso()));
    }

    static unlink(path: string | Buffer) {
        return new Promise<void>((reso, reject) =>
            fs.unlink(path, err => err ? reject(err) : reso()));
    }

    static rmdir(path: string | Buffer) {
        return new Promise<void>((reso, reject) =>
            fs.rmdir(path, err => err ? reject(err) : reso()));
    }

    static exists(path: string | Buffer) {
        return new Promise<boolean>((reso, reject) =>
            fs.exists(path, res => reso(res)));
    }

    /**
     * creates the directory specified in {path}.  Parameter {mode} defaults to 0777.
     * @param path
     * @param mode
     * @returns {Promise<T>}
     */
    static mkdir(path: string | Buffer, mode?: string | number) {
        return new Promise<void>((reso, reject) => {
            let cb = err => err ? reject(err) : reso();
            if (mode)
                fs.mkdir(path, mode as string, cb);
            else
                fs.mkdir(path, cb);
        })
    }


    /**
     * 创建缓存目录
     */
    static async createTemp() {
        if (!await dfvFile.exists(dfv.tempMenu)) {
            await dfvFile.mkdirs(dfv.tempMenu)
            for (let i = 1; i <= 31; i++) {
                await dfvFile.mkdir(dfv.tempMenu + i + "/");
            }
        }
    }

    /**
     * 清空2天前的缓存
     */
    static clearTemp() {
        let now = new Date();
        now.setDate(now.getDate() - 2)
        return dfvFile.deleteFolderRecursive(dfv.tempMenu + now.getDate() + "/");
    }

}