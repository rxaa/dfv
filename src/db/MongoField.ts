import { MongoTable } from "./MongoTable";
import { ObjectID } from "mongodb";
import { dfv } from "../public/dfv";
import { sql } from "../public/sql";
export class MongoField {

    private arrayType: MongoField | null = null;


    static getArrayType(val: any) {
        if (val instanceof MongoField) {
            return (val as MongoField).arrayType
        }
        else {
            return MongoField.getObjField(val).arrayType;
        }
    }

    static setArrayTypeName(val: any, name: string) {
        if (val instanceof MongoField) {
            (val as MongoField).fieldName = name;
        }
        else {
            MongoField.getObjField(val).fieldName = name;
        }
    }

    constructor(public fieldName: string,
        private table: MongoTable,
        val: any,
        private prevField?: MongoField | null) {

    }

    static setObjField(obj: any, field: MongoField) {
        Object.defineProperty(obj, "__MongoField__", {
            value: field,
            enumerable: false,
        });
    }

    static getObjField(obj: any): MongoField {
        return obj.__MongoField__;
    }

    static newField(fieldName: string, table: MongoTable, val: any, prevField?: MongoField) {
        if (val instanceof Number || val instanceof String || val instanceof ObjectID) {
            return new MongoField(fieldName, table, val, prevField);
        }

        if (val instanceof Array) {
            let type = dfv.getArrayType(val);

            if (type) {
                let f = new MongoField(fieldName, table, val, prevField)
                var arr = MongoField.newField("", table, new type, f);
                f.arrayType = arr;
                return f;
            }
            else {
                return new MongoField(fieldName, table, val, prevField);
            }
        }


        //自定义对象
        if (val != null && typeof val === "object") {
            let prev = new MongoField(fieldName, table, val, prevField)

            for (let k in val) {
                MongoTable.addIndex(val.constructor, k, table.index_);

                val[k] = MongoField.newField(k, table, val[k], prev);
            }
            MongoField.setObjField(val, prev);
            val.toString = function () {
                MongoField.getObjField(this).table.valList.push(MongoField.getObjField(this).fieldName);
                return "";
            }
            val.valueOf = function () {
                MongoField.getObjField(this).table.valList.push(MongoField.getObjField(this).fieldName);
                return 1;
            }

            val.$set = function (field: string, val: any) {
                if (val === void 0) {
                    prev.addUpdate("$set", field);
                }
                else if (field)
                    prev.addUpdate("$set", val, "." + field);
                else
                    prev.addUpdate("$set", val);
            }
            val.$unset = function (field: string) {
                if (field)
                    prev.addUpdate("$unset", 1, "." + field);
                else
                    prev.addUpdate("$unset", 1);
            }

            return val;
        }

        return new MongoField(fieldName, table, val, prevField);
    }

    toString() {
        this.table.valList.push(this.fieldName);
        return "";
    }

    valueOf() {
        this.table.valList.push(this.fieldName);
        return 1;
    }

    getFieldName() {
        var prev = this.prevField;
        var ret = this.fieldName
        while (prev) {
            if (prev.fieldName.length > 0) {
                if (ret.length > 0) {
                    ret = prev.fieldName + "." + ret;
                }
                else {
                    ret = prev.fieldName;
                }
            }
            prev = prev.prevField;
        }
        return ret;
    }


    /**
     * 解析并生成where语句
     * @param func
     * @param valList
     * @returns {any}
     */
    static makeWhere(func: Function, valList: any[]) {
        if (!valList || valList.length < 1)
            return {};

        /**
         * 只有一个值时不做语法解析
         */
        if (valList.length === 1) {
            return valList[0];
        }

        let funStr = func + "";
        let pos = 0;
        for (; pos < funStr.length; pos++) {
            let c = funStr[pos];
            if (c === ">" || c === "{") {
                pos++;
                break;
            }

        }

        return MongoField.parseFunc({ funStr: funStr, pos: pos, valList: valList, valCount: 0 });
    }

    static runFunc(table: MongoTable, func: (f: any) => any, valList: any[], obj?: any) {
        let oldList = table.valList;
        valList.length = 0;
        table.valList = valList;
        if (obj) {
            var ret = func(obj);
        }
        else {
            var ret = func(table.classObj);
        }
        if (ret) {
            if (ret instanceof MongoField) {
                ret.toString()
            }
            else if (ret instanceof sql) {
                valList.length = 0;
                valList.push((ret as sql).func());
            }
            else if (MongoField.getObjField(ret)) {
                ret.toString()
            }
        }
        table.valList = oldList;
    }

    static parseFunc(dat: { funStr: string, pos: number, valList: any[], valCount: number }) {
        let ret: any = {};
        // 当前操作符
        let op = "";
        let arr = Array<any>();
        for (; dat.pos < dat.funStr.length; dat.pos++) {
            let c = dat.funStr[dat.pos];
            if (c === " " || c === "\t" || c === "\r" || c === "\n")
                continue;

            if (c === "(") {
                dat.pos++;
                arr.push(MongoField.parseFunc(dat))
                continue;
            }

            if (c === ")") {
                if (op.length == 0)
                    return arr[0];
                return ret;
            }

            if (c === "!") {
                continue;
            }

            if (c === "&" || c === "+") {
                if (op.length == 0) {
                    ret["$and"] = arr;
                }
                else if (op === "$or") {
                    let newArr = [arr.pop()];
                    arr.push({ $and: newArr });
                    arr = newArr;
                }

                op = "$and";
                continue;
            }

            if (c === "|") {
                if (op.length == 0) {
                    ret["$or"] = arr;
                }
                else if (op === "$and") {
                    arr = [ret];
                    ret = { $or: arr };
                }

                op = "$or";
                continue;
            }

            if (dat.valCount >= dat.valList.length)
                break;

            //一个值表达式
            arr.push(dat.valList[dat.valCount])
            dat.valCount++;
            dat.pos++;
            let bracketCount = 0;
            for (; dat.pos < dat.funStr.length; dat.pos++) {
                c = dat.funStr[dat.pos];
                if (c === "(") {
                    bracketCount++;
                }
                else if (c === ")") {
                    bracketCount--;
                    if (bracketCount <= 0 && dat.funStr[dat.pos + 1] !== '.') {
                        break;
                    }
                }
            }
        }

        if (op.length == 0)
            return arr[0];

        return ret;
    }


    static getValue(key: string, val: any) {
        if (val instanceof sql) {
            return (val as sql).func();
        }

        if (val instanceof MongoField) {
            return val.getFieldName();
        }

        if (val instanceof Array) {
            return val;
        }

        //将主键_id值强制转为ObjectID
        if (key == "_id" && val && !(val instanceof ObjectID))
            return new ObjectID(val);

        // if (val == null)
        //     return "null";
        return val;
    }


    /**
     * 等于
     * @param val
     */
    eq(val: number): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push(MongoField.getValue(this.fieldName, val));
            return 1;
        }
        var obj: any = {};
        obj[name] = MongoField.getValue(this.fieldName, val);
        this.table.valList.push(obj);
        return 1;
    }

    $eq(val: number) {
        return this.eq(val);
    }

    $regex(val: string) {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push({ $regex: val });
            return 1;
        }
        var obj: any = {};
        obj[name] = { $regex: val };
        this.table.valList.push(obj);
        return 1;
    }

    /**
     * like搜索
     * @param str
     */
    like(str: string): number {
        if (str && str.length > 0) {
            if (str[0] != "%") {
                str = "^" + str;
            }
            else {
                str = str.substr(1);
            }

            if (str[str.length - 1] != "%") {
                str += "$"
            }
            else {
                str = str.substr(0, str.length - 1);
            }
        }
        return this.$regex(str);
    }

    /**
     * 不等于
     * @param val
     */
    notEq(val: number): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push({ $ne: MongoField.getValue(this.fieldName, val) });
            return 1;
        }


        var obj: any = {};
        obj[name] = { '$ne': MongoField.getValue(this.fieldName, val) };
        this.table.valList.push(obj);
        return 1;
    }

    /**
     * 小于
     * @param val
     */
    le(val: number): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push({ $lt: MongoField.getValue(this.fieldName, val) });
            return 1;
        }

        var obj: any = {};
        obj[name] = { $lt: MongoField.getValue(this.fieldName, val) };
        this.table.valList.push(obj);
        return 1;
    }

    /**
     * 大于
     * @param val
     */
    gt(val: number): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push({ $gt: MongoField.getValue(this.fieldName, val) });
            return 1;
        }

        var obj: any = {};
        obj[name] = { $gt: MongoField.getValue(this.fieldName, val) };
        this.table.valList.push(obj);
        return 1;
    }

    /**
     * 小于等于
     * @param val
     */
    leEq(val: number): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push({ $lte: MongoField.getValue(this.fieldName, val) });
            return 1;
        }

        var obj: any = {};
        obj[name] = { $lte: MongoField.getValue(this.fieldName, val) };
        this.table.valList.push(obj);
        return 1;
    }

    /**
     * 大于等于
     * @param val
     */
    gtEq(val: number): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            this.table.valList.push({ $gte: MongoField.getValue(this.fieldName, val) });
            return 1;
        }

        var obj: any = {};
        obj[name] = { $gte: MongoField.getValue(this.fieldName, val) };
        this.table.valList.push(obj);
        return 1;
    }

    asc() {
        this.table.update_[this.getFieldName()] = 1;
        return 1;
    }

    desc() {
        this.table.update_[this.getFieldName()] = -1;
        return 1;
    }

    private addUpdate(op: string, val: any, extName?: string) {
        if (!this.table.update_[op]) {
            this.table.update_[op] = {};
        }

        if (extName) {
            this.table.update_[op][this.getFieldName() + extName] = val;
        }
        else
            this.table.update_[op][this.getFieldName()] = val;
    }

    set(val: number) {
        this.addUpdate('$set', MongoField.getValue(this.fieldName, val));
        return 1;
    }

    $set(val: number) {
        return this.set(val);
    }

    unset() {
        this.addUpdate('$unset', 1);
        return 1;
    }

    inc(val: number) {
        this.addUpdate('$inc', MongoField.getValue(this.fieldName, val));
        return 1;
    }

    push(val: any) {
        if (val instanceof Array) {
            this.addUpdate('$pushAll', MongoField.getValue(this.fieldName, val));
        }
        else {
            this.addUpdate('$push', MongoField.getValue(this.fieldName, val));
        }

        return 1;
    }


    pushAll(val: any) {
        return this.push(val);
    }

    addToSet(val: any, notEach?: boolean) {
        if (val instanceof Array) {
            if (notEach)
                this.addUpdate('$addToSet', MongoField.getValue(this.fieldName, val));
            else
                this.addUpdate('$addToSet', { $each: MongoField.getValue(this.fieldName, val) });
        }
        else {
            if (notEach)
                this.addUpdate('$addToSet', [MongoField.getValue(this.fieldName, val)]);
            else
                this.addUpdate('$addToSet', { $each: [MongoField.getValue(this.fieldName, val)] });
        }

        return 1;
    }

    pop() {
        this.addUpdate('$pop', 1);
        return 1;
    }

    popFirst() {
        this.addUpdate('$pop', -1);
        return 1;
    }

    elemMatch(func: (f: any) => any) {

    }

    pull(func: (f: any) => any) {
        if (this.arrayType == null) {
            throw Error("undefined array type:" + this.table.tableName + "." + this.getFieldName())
        }

        MongoField.setArrayTypeName(this.arrayType, "");

        let valList = Array<any>()

        let old = this.fieldName;
        let oldPrev = this.prevField;

        this.prevField = null;
        this.fieldName = "";
        MongoField.runFunc(this.table, func, valList, this.arrayType);
        this.fieldName = old;
        this.prevField = oldPrev;

        this.addUpdate('$pull', MongoField.makeWhere(func, valList));
        return 1;
    }

    get $() {
        if (this.arrayType == null) {
            throw Error("undefined array type:" + this.table.tableName + "." + this.getFieldName())
        }
        MongoField.setArrayTypeName(this.arrayType, "$");
        return this.arrayType;
    }

    at(index: number) {
        if (this.arrayType == null) {
            throw Error("undefined array type:" + this.table.tableName + "." + this.getFieldName())
        }

        if (index === void 0) {
            MongoField.setArrayTypeName(this.arrayType, "");
            return this.arrayType;
        }
        else {
            MongoField.setArrayTypeName(this.arrayType, index + "");
            return this.arrayType;
        }
    }


    in(val: number | number[]): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            if (val instanceof Array)
                this.table.valList.push({ $in: MongoField.getValue(this.fieldName, val) });
            else
                this.table.valList.push({ $in: [MongoField.getValue(this.fieldName, val)] });

            return 1;
        }


        var obj: any = {};
        if (val instanceof Array)
            obj[name] = { $in: MongoField.getValue(this.fieldName, val) };
        else
            obj[name] = { $in: [MongoField.getValue(this.fieldName, val)] };
        this.table.valList.push(obj);
        return 1;
    }

    notIn(val: number | number[]): number {
        var name = this.getFieldName();
        if (name.length == 0) {
            if (val instanceof Array)
                this.table.valList.push({ $nin: MongoField.getValue(this.fieldName, val) });
            else
                this.table.valList.push({ $nin: [MongoField.getValue(this.fieldName, val)] });

            return 1;
        }


        var obj: any = {};
        if (val instanceof Array)
            obj[name] = { $nin: MongoField.getValue(this.fieldName, val) };
        else
            obj[name] = { $nin: [MongoField.getValue(this.fieldName, val)] };
        this.table.valList.push(obj);
        return 1;
    }


    /**
     * 全文索引搜索
     * @param str
     * @param boolMode 是否开启IN BOOLEAN MODE
     */
    matchAgainst(str: string, boolMode?: boolean): number {
        var obj = { $text: { $search: MongoField.getValue(this.fieldName, str) } };
        this.table.valList.push(obj);
        return 1;
    }

    all(val: number | number[]): number {
        var obj: any = {};
        if (val instanceof Array)
            obj[this.getFieldName()] = { $all: MongoField.getValue(this.fieldName, val) };
        else
            obj[this.getFieldName()] = { $all: [MongoField.getValue(this.fieldName, val)] };

        this.table.valList.push(obj);
        return 1;
    }
}