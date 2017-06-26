import {SqlBuilder} from "./SqlBuilder";
import {SqlTableInfo} from "./SqlTableInfo";
import {sql} from "../../public/sql";
import {dfv} from "../../public/dfv";

export class SqlTableField {


    /**
     *
     * @param fieldName class中的字段名
     * @param rawName 数据库中的字段名
     * @param fromTable 数据库表名
     * @param table
     */
    constructor(public fieldName: string,
                public rawName: string | null,
                public fromTable: string | null,
                private table: SqlTableInfo) {
    }

    /**
     * 不为空的数据库字段名
     * @type {string}
     */
    public realName = this.rawName ? this.rawName : this.fieldName;

    toString() {
        this.table.valList.push(this.getFieldName());
        return this.getFieldName();
    }

    valueOf() {
        this.table.valList.push(this.getFieldName());
        return this.getFieldName();
    }

    getFieldName() {
        if (this.fromTable) {
            return this.fromTable + "." + this.realName;
        }

        if (this.table.tableNamePrefix)
            return this.table.tableName + "." + this.realName;

        return this.realName;
    }

    getFieldAsName() {
        if (this.rawName)
            return this.getFieldName() + " as " + this.fieldName;

        return this.getFieldName();
    }

    /**
     * 解析并生成where语句
     * @param func
     * @param valList
     * @returns {any}
     */
    static makeWhere(func: Function, valList: string[]) {
        if (valList.length < 1)
            return "";

        /**
         * 只有一个值时不做词法解析
         */
        if (valList.length === 1) {
            return valList[0];
        }

        var funStr = func + "";

        //字串当前解析位置
        var pos = 0;
        var c = 0;
        for (; pos < funStr.length; pos++) {
            c = funStr.charCodeAt(pos);
            //c == ">" || c == "{"
            if (c == 62 || c == 123) {
                pos++;
                break;
            }
        }

        var valCount = 0;

        var where = "";
        for (; pos < funStr.length; pos++) {
            c = funStr.charCodeAt(pos);
            //c === " " || c === "\r"  || c === "\t" || c === "\n" || c === "{" || c === "}"
            if (c >= 9 && c <= 32 || c == 123 || c == 125)
                continue;

            if (c == 40) {
                where += "(";
                continue;
            }

            if (c == 41) {
                where += ")";
                continue;
            }

            if (c == 33) {
                where += "!";
                continue;
            }

            //c === "&" || c === "+"
            if (c == 38 || c == 43) {
                where += " and ";
                continue;
            }

            //c === "|"
            if (c == 124) {
                where += " or ";
                continue;
            }

            if (valCount >= valList.length)
                break;

            //一个值表达式
            where += valList[valCount];
            valCount++;
            pos++;
            var bracketCount = 0;
            for (; pos < funStr.length; pos++) {
                c = funStr.charCodeAt(pos);
                //c === "("
                if (c == 40) {
                    bracketCount++;
                }
                //c === ")"
                else if (c == 41) {
                    bracketCount--;
                    if (bracketCount <= 0) {
                        break;
                    }
                }
            }
        }

        return where;
    }

    static getValue(val: any): string {
        if (val instanceof sql) {
            return (val as sql).func();
        }

        if (val instanceof SqlTableField) {
            return val.getFieldName();
        }

        if (val instanceof SqlBuilder) {
            return "(" + (val as SqlBuilder<any>).getSelectSql() + ")";
        }

        if (val instanceof Date)
            return "'" + dfv.dateToY_M_D_H_M_S(<Date>val) + "'";

        return sql.filter(val);
    }

    /**
     * 等于
     * @param val
     */
    eq(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "=" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    $eq(val: number): number {
        return this.eq(val);
    }

    findInSet(val: string) {
        this.table.valList.push(` FIND_IN_SET(${SqlTableField.getValue(val)},${this.getFieldName()}) `);
        return 1;
    }

    /**
     * 不等于
     * @param val
     */
    notEq(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "!=" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * 小于
     * @param val
     */
    le(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "<" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * 大于
     * @param val
     */
    gt(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + ">" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * 小于等于
     * @param val
     */
    leEq(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "<=" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * 大于等于
     * @param aa
     */
    gtEq(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + ">=" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    in(val: number | number[], op = " in"): number {
        if (Array.isArray(val)) {
            let str = " ";
            for (let u of val) {
                str += SqlTableField.getValue(u) + ",";
            }
            this.table.valList.push(" " + this.getFieldName() + op + " (" + str.removeLast() + ") ");
        }
        else {
            this.table.valList.push(" " + this.getFieldName() + op + " (" + SqlTableField.getValue(val) + ") ");
        }
        return 1;
    }

    notIn(val: number | number[]) {
        return this.in(val, " not in");
    }

    /**
     *  set用于update
     * @param val
     */
    set(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "=" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * +=
     * @param val
     */
    addSet(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "=" + this.fieldName + "+" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * +=
     * @param val
     */
    inc(val: number): number {
        return this.addSet(val);
    }

    /**
     * -=
     * @param val
     */
    dec(val: number): number {
        return this.subSet(val);
    }

    /**
     * -=
     * @param val
     */
    subSet(val: number): number {
        this.table.valList.push(" " + this.getFieldName() + "=" + this.fieldName + "-" + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * 正序,用于order by
     */
    asc(): number {
        this.table.valList.push(" " + this.getFieldName() + " asc ");
        return 1;
    }

    /**
     * 倒序,用于order by
     */
    desc(): number {
        this.table.valList.push(" " + this.getFieldName() + " desc ");
        return 1;
    }


    like(val: string): number {
        this.table.valList.push(" " + this.getFieldName() + " like " + SqlTableField.getValue(val) + " ");
        return 1;
    }

    /**
     * 用于select
     */
    sum(): SqlTableField {
        // this.table.valList.push(" sum(" + this.fieldName + ") ");
        return new SqlTableField(" sum(" + this.getFieldName() + ") ", null, null, this.table);
    }

    /**
     * 用于select
     */
    max(): SqlTableField {
        // this.table.valList.push(" max(" + this.fieldName + ") ");
        return new SqlTableField(" max(" + this.getFieldName() + ") ", null, null, this.table);
    }

    /**
     * 用于select
     */
    avg(): SqlTableField {
        // this.table.valList.push(" avg(" + this.fieldName + ") ");
        return new SqlTableField(" avg(" + this.getFieldName() + ") ", null, null, this.table);
    }

    /**
     * 用于select
     */
    min(): SqlTableField {
        // this.table.valList.push(" min(" + this.fieldName + ") ");
        return new SqlTableField(" min(" + this.getFieldName() + ") ", null, null, this.table);
    }

    /**
     * 用于select
     */
    count(): SqlTableField {
        // this.table.valList.push(" count(" + this.fieldName + ") ");
        return new SqlTableField(" count(" + this.getFieldName() + ") ", null, null, this.table);
    }

    /**
     * +
     */
    add(val: number | SqlTableField): SqlTableField {
        // this.table.valList.push(" count(" + this.fieldName + ") ");
        return new SqlTableField(" " + this.getFieldName() + "+" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    /**
     * -
     */
    sub(val: number | SqlTableField): SqlTableField {
        // this.table.valList.push(" count(" + this.fieldName + ") ");
        return new SqlTableField(" " + this.getFieldName() + "-" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    /**
     * *
     */
    mul(val: number | SqlTableField): SqlTableField {
        // this.table.valList.push(" count(" + this.fieldName + ") ");
        return new SqlTableField(" " + this.getFieldName() + "*" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    /**
     * /
     */
    div(val: number | SqlTableField): SqlTableField {
        // this.table.valList.push(" count(" + this.fieldName + ") ");
        return new SqlTableField(" " + this.getFieldName() + "/" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    concat(left: SqlTableField | string, right: SqlTableField | string): SqlTableField {
        return new SqlTableField(" " + this.getFieldName() + "=concat(" + SqlTableField.getValue(left) + "," + SqlTableField.getValue(right) + ")", null, null, this.table);
    }

    /**
     * 全文索引搜索
     * @param str
     * @param boolMode 是否开启IN BOOLEAN MODE
     */
    matchAgainst(str: string, boolMode?: boolean): SqlTableField {
        if (boolMode)
            return new SqlTableField(` MATCH(${this.getFieldName()}) AGAINST (${SqlTableField.getValue(str)} IN BOOLEAN MODE)`, null, null, this.table);
        else
            return new SqlTableField(` MATCH(${this.getFieldName()}) AGAINST (${SqlTableField.getValue(str)})`, null, null, this.table);
    }
}