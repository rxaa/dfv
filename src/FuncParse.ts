/**
 * 词法解析类型
 */
export enum opType{
    //操作符
    operator,
    var,//单词
    string,//字串
    comment,//注释
    invalid,
}

/**
 * 解析函数字串
 */
export class FuncParse {
    /**
     * 参数名
     * @type {Array}
     */
    paras: string[] = [];
    body: string = "";
    //函数名
    funcName: string;
    /**
     * 函数体(去除形参部分)起始位置
     * @type {number}
     */
    pos = 0;

    //单词ascii码范围(0-9 _ a-z A-Z)
    static varArr: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


    static getFieldName(func: Function) {
        let str = func.toString();
        return str.substring(str.indexOf(".") + 1);

    }

    constructor(func: Function) {
        this.body = func.toString();
        let count = 0;
        FuncParse.parseLexical(this.body, 0, (op, type, pos) => {
            count++;

            if (op == "=>" || op == "{") {
                this.pos = pos;
                return false;
            }

            if (op == "(" && this.paras.length > 0) {
                this.funcName = this.paras[this.paras.length - 1];
                this.paras.pop();
            }

            if (count == 1 && op == "function")
                return true;

            if (type == opType.var)
                this.paras.push(op);

            return true;
        });
    }

    /**
     * 函数体词法解析
     * @param cb
     */
    parseBody(cb: (op: string, type: opType, pos?: number) => boolean | void) {
        FuncParse.parseLexical(this.body, this.pos, cb);
    }

    /**
     * 词法解析
     * @param funcStr
     * @param startPos
     * @param cb 返回flase中断解析
     * @param negative 是否倒序解析
     */
    static parseLexical(funcStr: string, startPos: number, cb: (op: string, type: opType, pos: number) => boolean | void, negative?: boolean) {
        if (!negative) {
            FuncParse.parseLexicalPositive(funcStr, startPos, cb);
            return;
        }
        let symb = "";
        let type = opType.invalid;
        let i = startPos
        let foot = -1;

        let addSymb = (c: string) => {
            symb = c + symb;
        }

        let fixComment = () => {
            if (symb.indexOf("//") == 0) {
                symb = symb.substring(2);
                type = opType.comment;
            }
        }

        for (; ; i += foot) {
            if (i < 0)
                break;

            let c = funcStr[i];

            //跳过的字符
            if (c == ' ' || c == '\r' || c == '  ') {
                if (symb.length > 0) {
                    fixComment();
                    if (cb(symb, type, i) === false)
                        return;
                    symb = "";
                }
                continue;
            }


            //特数字符
            if (c == '(' || c == ')' || c == '\n') {
                if (symb.length > 0) {
                    fixComment();
                    if (cb(symb, type, i) === false)
                        return;
                    symb = "";
                }

                if (cb(c, opType.operator, i + foot) === false)
                    return;
                continue;
            }

            //字串
            if (c == "'" || c == "\"") {
                let stringSymble = c;
                if (symb.length > 0) {
                    if (cb(symb, type, i) === false)
                        return;
                    symb = "";
                }

                i += foot;
                for (; ; i += foot) {
                    if (i < 0)
                        break;

                    c = funcStr[i];
                    if (c === stringSymble) {
                        if (funcStr[i - 1] == "\\") {
                            addSymb(stringSymble);
                            i--;
                            continue;
                        }

                        if (cb(symb, opType.string, i) === false)
                            return;
                        symb = "";
                        break;
                    }

                    addSymb(c);
                }
                continue;
            }


            //单词
            if (FuncParse.varArr[c.charCodeAt(0)]) {
                if (type === opType.var) {
                    addSymb(c);
                }
                else {
                    if (symb.length > 0) {
                        if (cb(symb, type, i) === false)
                            return;
                    }

                    symb = c;
                    type = opType.var;
                }
                continue;
            }


            //其他符号
            if (type === opType.operator) {
                addSymb(c);
            }
            else {
                if (symb.length > 0) {
                    fixComment();
                    if (cb(symb, type, i) === false)
                        return;
                }
                symb = c;
                type = opType.operator;
            }

            //注释
            if (symb == "/*" || symb == "*/") {
                symb = "";
                i += foot;
                for (; ; i += foot) {
                    if (i < 0)
                        break;

                    if (funcStr[i] === "*" && funcStr[i + foot] === "/") {
                        // addSymb("*");
                        // addSymb("/");
                        i += foot;
                        if (cb(symb, opType.comment, i) === false)
                            return;
                        symb = "";
                        break;
                    }

                    addSymb(funcStr[i]);
                }

            }///////////////注释

        }

        //最后一个词
        if (symb.length > 0) {
            if (cb(symb, i, type) === false)
                return;
        }
    }

    static parseLexicalPositive(funcStr: string, startPos: number, cb: (op: string, type: opType, pos?: number) => boolean | void) {
        let symb = "";
        let type = opType.invalid;
        let i = startPos

        for (; i < funcStr.length; i += 1) {
            let c = funcStr[i];

            //跳过的字符
            if (c == ' ' || c == '\r' || c == '\t') {
                if (symb.length > 0) {
                    if (cb(symb, type, i) === false)
                        return;
                    symb = "";
                }
                continue;
            }


            //特数字符
            if (c == '(' || c == ')' || c == '\n') {

                if (symb.length > 0) {
                    if (cb(symb, type, i) === false)
                        return;
                    symb = "";
                }

                if (cb(c, opType.operator, i + 1) === false)
                    return;
                continue;
            }

            //字串
            if (c == "'" || c == "\"") {
                let stringSymble = c;
                if (symb.length > 0) {
                    if (cb(symb, type, i) === false)
                        return;
                    symb = "";
                }

                i += 1;
                for (; i < funcStr.length; i += 1) {
                    c = funcStr[i];
                    if (c === '\\') {
                        i += 1;
                        if (funcStr[i] !== stringSymble)
                            symb += "\\";
                        symb += funcStr[i];
                        continue;
                    }

                    if (c === stringSymble) {
                        if (cb(symb, opType.string, i) === false)
                            return;
                        symb = "";
                        break;
                    }

                    symb += c;
                }
                continue;
            }


            //单词
            if (FuncParse.varArr[c.charCodeAt(0)]) {
                //if (c == "_" || c >= "0" && c <= "9" || c >= "a" && c <= "z" || c >= "A" && c <= "Z") {
                if (type === opType.var) {
                    symb += c;
                }
                else {
                    if (symb.length > 0) {
                        if (cb(symb, type, i) === false)
                            return;
                    }

                    symb = c;
                    type = opType.var;
                }
                continue;
            }

            //其他符号
            if (type === opType.operator) {
                symb += c;
            }
            else {
                if (symb.length > 0) {
                    if (cb(symb, type, i) === false)
                        return;
                }
                symb = c;
                type = opType.operator;
            }

            //注释
            if (symb === "/*") {
                symb = "";
                i += 1;
                for (; i < funcStr.length; i += 1) {

                    if (funcStr[i] === "*" && funcStr[i + 1] === "/") {
                        i += 1;
                        if (cb(symb, opType.comment, i) === false)
                            return;
                        symb = "";
                        break;
                    }

                    symb += funcStr[i];
                }

            }///////////////注释
            else if (symb === "//") {
                symb = "";
                i += 1;
                for (; i < funcStr.length; i += 1) {
                    if (funcStr[i] === "\r")
                        continue;

                    if (funcStr[i] === "\n") {
                        if (cb(symb, opType.comment, i) === false)
                            return;
                        symb = "";
                        i--;
                        break;
                    }

                    symb += funcStr[i];
                }
            }
        }

        //最后一个词
        if (symb.length > 0) {
            if (cb(symb, i, type) === false)
                return;
        }
    }

}