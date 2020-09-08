import { SqlBuilder } from "./SqlBuilder";
import { SqlTableInfo, TableObject } from "./SqlTableInfo";
import { sql } from "../public/sql";
import { dfv } from "../public/dfv";

export class SqlTableField<FieldT, ClassT> {


    /**
     *
     * @param fieldName class中的字段名,或者作为sum(),count()等函数表达式
     * @param rawName 数据库中的字段名
     * @param fromTable 数据库表名
     * @param table
     */
    constructor(
        public classObj: TableObject<ClassT>,
        public fieldName: string,
        public rawName: string | null,
        public fromTable: string | null,
        private table: SqlTableInfo<ClassT>) {
    }

    toString() {
        return this.getFieldName();
    }

    valueOf() {
        return this.getFieldName();
    }

    getFieldName() {
        if (this.fromTable) {
            return "`" + this.fromTable + "`.`" + this.rawName + "`";
        }

        if (this.table.tableNamePrefix)
            return "`" + this.table.tableName + "`.`" + this.rawName + "`";

        if (this.rawName)
            return "`" + this.rawName + "`";

        return this.fieldName;
    }

    getFieldAsName() {
        if (this.rawName)
            return this.getFieldName() + " as `" + this.fieldName + "`";;
        return this.getFieldName();
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

    private genSql(str: string): TableObject<ClassT> {
        if (this.table.commaPrefix) {
            if (this.table.sqlStr.length > 0) {
                this.table.sqlStr += ",";
            }
        }
        this.table.sqlStr += " " + str + " ";
        return this.table.classObj;
    }

    //and 逻辑操作
    get and(): TableObject<ClassT> {
        if (this.table.commaPrefix)
            return this.table.classObj;
        else
            return this.genSql("and");
    }

    //or 逻辑操作
    get or(): TableObject<ClassT> {
        if (this.table.commaPrefix)
            return this.table.classObj;
        else
            return this.genSql("or");
    }

    /**
     * and操作并将func入参表达式放入()括号内
     * @param func 
     */
    andWrap(func: (f: TableObject<ClassT>) => any): TableObject<ClassT> {
        if (this.table.commaPrefix)
            return this.genSql("(" + this.table.makeFunc(func, this.table.commaPrefix) + ")");
        else
            return this.genSql("and (" + this.table.makeFunc(func, this.table.commaPrefix) + ")");
    }

    /**
     * 
     * @param func 
     */
    orWrap(func: (f: TableObject<ClassT>) => any): TableObject<ClassT> {
        if (this.table.commaPrefix)
            return this.genSql("(" + this.table.makeFunc(func, this.table.commaPrefix) + ")");
        else
            return this.genSql("or (" + this.table.makeFunc(func, this.table.commaPrefix) + ")");
    }
    /**
     * 等于
     * @param val
     */
    eq(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        this.genSql(this.getFieldName() + " = " + SqlTableField.getValue(val));
        return this;
    }

    findInSet(val: string): this {
        this.genSql(`FIND_IN_SET(${SqlTableField.getValue(val)},${this.getFieldName()})`);
        return this;
    }

    /**
     * 不等于
     * @param val
     */
    notEq(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        this.genSql(this.getFieldName() + " != " + SqlTableField.getValue(val));
        return this;
    }

    /**
     * 小于
     * @param val
     */
    le(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        this.genSql(this.getFieldName() + " < " + SqlTableField.getValue(val));
        return this;
    }


    /**
     * 大于
     * @param val
     */
    gt(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        this.genSql(this.getFieldName() + " > " + SqlTableField.getValue(val));
        return this;
    }

    /**
     * 小于等于
     * @param val
     */
    leEq(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        this.genSql(this.getFieldName() + " <= " + SqlTableField.getValue(val));
        return this;
    }

    /**
     * 大于等于
     * @param aa
     */
    gtEq(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        this.genSql(this.getFieldName() + " >= " + SqlTableField.getValue(val));
        return this;
    }

    in(val: FieldT | FieldT[] | SqlTableField<any, any> | SqlBuilder<any, any>, op = " in"): this {
        if (Array.isArray(val)) {
            let str = "";
            for (let u of val) {
                if (str.length > 0)
                    str += ",";
                str += SqlTableField.getValue(u);
            }
            this.genSql(this.getFieldName() + op + " (" + str + ")");
        }
        else {
            this.genSql(this.getFieldName() + op + " (" + SqlTableField.getValue(val) + ")");
        }
        return this;
    }

    notIn(val: FieldT | FieldT[] | SqlTableField<any, any> | SqlBuilder<any, any>): this {
        return this.in(val, " not in");
    }

    concat(left: FieldT | SqlTableField<any, any>, right: FieldT | SqlTableField<any, any>): this {
        this.genSql(this.getFieldName() + "=concat(" + SqlTableField.getValue(left) + "," + SqlTableField.getValue(right) + ")");
        return this;
    }


    /**
     *  set用于update
     * @param val
     */
    set(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): TableObject<ClassT> {
        return this.genSql(this.getFieldName() + " = " + SqlTableField.getValue(val));
    }

    /**
     * +=
     * @param val
     */
    addSet(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>, op = "+"): TableObject<ClassT> {
        return this.genSql(this.getFieldName() + " = " + this.getFieldName() + op + SqlTableField.getValue(val));
    }

    /**
     * +=
     * @param val
     */
    inc(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): TableObject<ClassT> {
        return this.addSet(val);
    }

    /**
     * -=
     * @param val
     */
    dec(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): TableObject<ClassT> {
        return this.subSet(val);
    }

    /**
     * -=
     * @param val
     */
    subSet(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): TableObject<ClassT> {
        return this.addSet(val, "-");
    }



    /**
     * 正序,用于order by
     */
    get asc(): TableObject<ClassT> {
        return this.genSql(this.getFieldName() + " asc");
    }

    /**
     * 倒序,用于order by
     */
    get desc(): TableObject<ClassT> {
        return this.genSql(this.getFieldName() + " desc");
    }


    like(val: FieldT | SqlTableField<any, any> | SqlBuilder<any, any>): TableObject<ClassT> {
        return this.genSql(this.getFieldName() + " like " + SqlTableField.getValue(val));
    }

    /**
     * 全文索引搜索
     * @param str
     * @param boolMode 是否开启IN BOOLEAN MODE
     */
    matchAgainst(str: string, boolMode?: boolean): TableObject<ClassT> {
        if (boolMode)
            return this.genSql(`MATCH(${this.getFieldName()}) AGAINST (${SqlTableField.getValue(str)} IN BOOLEAN MODE)`);
        else
            return this.genSql(`MATCH(${this.getFieldName()}) AGAINST (${SqlTableField.getValue(str)})`);
    }

    /**
     * 用于select
     */
    sum(): number {
        return new SqlTableField(this.classObj, " sum(" + this.getFieldName() + ") ", null, null, this.table) as any;
    }

    /**
     * 用于select
     */
    max(): number {
        return new SqlTableField(this.classObj, " max(" + this.getFieldName() + ") ", null, null, this.table) as any;
    }

    /**
     * 用于select
     */
    avg(): number {
        return new SqlTableField(this.classObj, " avg(" + this.getFieldName() + ") ", null, null, this.table) as any;
    }

    /**
     * 用于select
     */
    min(): number {
        return new SqlTableField(this.classObj, " min(" + this.getFieldName() + ") ", null, null, this.table) as any;
    }

    /**
     * 用于select
     */
    count(): number {
        return new SqlTableField(this.classObj, " count(" + this.getFieldName() + ") ", null, null, this.table) as any;
    }

    /**
     * +加
     */
    add(val: FieldT | SqlTableField<any, any>): SqlTableField<FieldT, ClassT> {
        return new SqlTableField(this.classObj, " " + this.getFieldName() + "+" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    /**
     * -减
     */
    sub(val: FieldT | SqlTableField<any, any>): SqlTableField<FieldT, ClassT> {
        return new SqlTableField(this.classObj, " " + this.getFieldName() + "-" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    /**
     * *乘
     */
    mul(val: FieldT | SqlTableField<any, any>): SqlTableField<FieldT, ClassT> {
        return new SqlTableField(this.classObj, " " + this.getFieldName() + "*" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }

    /**
     * /除
     */
    div(val: FieldT | SqlTableField<any, any>): SqlTableField<FieldT, ClassT> {
        return new SqlTableField(this.classObj, " " + this.getFieldName() + "/" + SqlTableField.getValue(val) + " ", null, null, this.table);
    }




}