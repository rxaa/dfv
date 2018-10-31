import { dfvWindow, PopWindowPara } from "./dfvWindow";
export enum HttpType {
    GET,
    POST,
    DELETE,
    PUT,
}

export interface AjaxResp {
    status: number;
    content: string;
}

export const LocalName = {
    input: "input",
    button: "button",
    textarea: "textarea",
    select: "select",
    a: "a",
    q: "q",
    div: "div",
    tr: "tr",
    td: "td",
    th: "th",
    tbody: "tbody",
    span: "span",
}


export const InputType = {
    button: "button",
    checkbox: "checkbox",
    file: "file",
    hidden: "hidden",
    password: "password",
    radio: "radio",
    reset: "reset",
    submit: "submit",
    text: "text",
}

export class dfvFront {
    /**
     * 设置body内容
     */
    static setBody(ele: string | HTMLElement) {
        dfvFront.setEle(document.body, ele);
    }


    /**
     * 设置dom元素的内容
     * @param elem dom元素或id名
     * @param args
     */
    static setEle(elem: HTMLElement | string | number, args: any) {
        dfvFront.addEle(elem, args, true);
    }

    /**
     * 公共异常处理函数
     * @param err
     */
    static onCatchError = (err: Error) => {
        dfvFront.msgErr(err + "", { closeTime: 5 * 1000 });
        console.error(err);
    }

    /**
     * 弹出对话框
     * @param cont 内容
     * @param title 标题
     * @param ext
     */
    static alert(title: string | HTMLElement, cont?: string | HTMLElement, ext: PopWindowPara = {}) {
        return new dfvWindow().procParas(ext).show(title, cont)
    }


    /**
     * 弹出错误对话框
     * @param cont 内容
     * @param title 标题
     * @param ext
     */
    static alertErr(title: string | HTMLElement, cont?: string | HTMLElement, ext: PopWindowPara = {}) {
        ext.isErr = true;
        return new dfvWindow().procParas(ext).show(title, cont)
    }

    /**
     * 弹出一个会自动关闭的消息窗口
     * @param cont 内容
     * @param ext 其他参数
     */
    static msg(cont: string | HTMLElement, ext: PopWindowPara = {}) {
        if (!window.document) {
            window.alert(cont)
            return;
        }
        if (ext.closeTime === void 0)
            ext.closeTime = 3000;
        return new dfvWindow().procParas(ext).show(cont);
    }

    /**
     * 弹出一个会自动关闭的错误提示消息窗口
     * @param cont
     * @param ext
     * @returns {undefined|dfvWindow}
     */
    static msgErr(cont: string | HTMLElement, ext: PopWindowPara = {}) {
        ext.isErr = true;
        return dfvFront.msg(cont, ext);
    }

    /**
     * 关闭进度窗口
     */
    static loadStop() {
        if (!window.document) {
            return
        }
        let spinner = document.getElementById("load_global");
        if (spinner)
            document.body.removeChild(spinner);

        let cover_div = document.getElementById("load_cover");
        if (cover_div)
            document.body.removeChild(cover_div);

    }

    /**
     *
     * @returns {boolean}
     */
    static isLoading(): boolean {
        return document.getElementsByClassName("spinner").length > 0;
    }

    /**
     * 显示加载中进度条
     * @param coverAll 是否覆盖整个窗口
     * @param black 黑色背景
     * @param msg 文字提示
     */
    static loadStart(coverAll?: boolean, black?: boolean, msg?: string) {
        if (!window.document) {
            return
        }

        dfvFront.loadStop();
        if (!msg) {
            msg = "加载中"
        }

        let ele = document.createElement("div");
        ele.className = "spinner anim_height"
        ele.id = "load_global";
        ele.innerHTML =
            "<div class=\"spinner-container container1\">" +
            "    <div class=\"circle1\"></div>" +
            "    <div class=\"circle2\"></div>" +
            "    <div class=\"circle3\"></div>" +
            "    <div class=\"circle4\"></div>" +
            "  </div>" +
            "  <div class=\"spinner-container container2\">" +
            "    <div class=\"circle1\"></div>" +
            "    <div class=\"circle2\"></div>" +
            "    <div class=\"circle3\"></div>" +
            "    <div class=\"circle4\"></div>" +
            "  </div>" +
            "  <div class=\"spinner-container container3\">" +
            "    <div class=\"circle1\"></div>" +
            "    <div class=\"circle2\"></div>" +
            "    <div class=\"circle3\"></div>" +
            "    <div class=\"circle4\"></div>" +
            `</div><q style='margin-top: 30px'>${msg}</q>`;

        if (coverAll && !document.getElementById("load_cover")) {
            let cover = document.createElement("div");
            cover.id = "load_cover"
            cover.className = "cover_div"
            if (black)
                cover.className = "cover_div cover_black"
            document.body.appendChild(cover);
        }

        document.body.appendChild(ele);
        // ele.style.height = "80px";

    }

    /**
     * 添加dom元素的内容
     * @param elem dom元素或id名
     * @param args
     * @param clear
     */
    static addEle(elem: HTMLElement | string | number, args: any, clear?: boolean) {
        if (typeof elem === "string" || typeof elem === "number") {
            elem = document.getElementById(elem + "")!;
        }

        if (elem == null) {
            return;
        }

        if (clear)
            (elem as HTMLElement).innerHTML = "";

        if (args == null)
            return;

        if (args instanceof Function) {
            try {
                args();
            } catch (e) {
                dfvFront.onCatchError(e);
            }
        }
        // else if (args instanceof Node) {
        // elem.appendChild(args);
        // }
        else if (args instanceof Array) {
            for (var a of args) {
                dfvFront.addEle(elem, a);
            }
        }
        else if ((args as HTMLElement).localName !== void 0) {
            (elem as HTMLElement).appendChild(args);
        }
        else {
            if ((elem as HTMLElement).children.length > 0) {
                (elem as HTMLElement).appendChild(document.createTextNode(args + ""));
            }
            else {
                (elem as HTMLElement).innerHTML += args + "";
            }
        }
    }

    /**
     * 执行指定js代码，
     * @param str
     * @param ele
     */
    static appendJS(str: string, ele: HTMLElement) {
        let scriptRegExp = /<script[^>]*>((.|\n|\r)*?(?=<\/script>))<\/script>/ig;
        let result: RegExpExecArray | null = null;
        while ((result = scriptRegExp.exec(str)) != null) {
            var script = document.createElement("script");
            script.text = result[1];
            ele.appendChild(script);
        }
    }

    /**
     * 移除className属性中的name
     * @param ele
     * @param name
     */
    static classRemove(ele: HTMLElement, name: string) {
        let res = ele.className.split(" ");
        let newClass = "";
        for (let c in res) {
            if (res[c] == name)
                continue;
            else
                newClass += res[c] + " ";
        }

        ele.className = newClass;
    }

    static scrollToTop() {
        window.scrollTo(window.scrollX, 0);
    }

    /**
     * 设置input焦点
     * @param sel
     * @param start
     * @param end
     */
    static setFocus(sel: HTMLInputElement, start: number, end: number) {
        if (sel.setSelectionRange) {
            sel.focus();
            sel.setSelectionRange(start, end);
        } else if ((sel as any).createTextRange) {
            var range = (sel as any).createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    }

    /**
     * 将input焦点设置结尾
     * @param sel
     */
    static setFocusEnd(sel: HTMLInputElement) {
        let length = sel.value.length;
        dfvFront.setFocus(sel, length, length);
    }

    /**
     * 广度优先遍历element的子成员
     * @param eleme
     * @param callback
     */
    static eachElement(eleme: HTMLElement | string | number | null, callback: (res: HTMLElement) => void | boolean) {
        var elem = eleme as HTMLElement;

        if (typeof eleme === "string") {
            elem = document.getElementById(eleme + "") as HTMLElement;
        }
        else if (typeof eleme === "number") {
            elem = document.getElementById(eleme + "") as HTMLElement;
        }

        if (eleme == null)
            return;

        let eleList: HTMLElement[] = [];

        for (; ;) {
            for (let i = 0; i < elem.children.length; i++) {

                let e = elem.children[i] as HTMLElement;

                if (callback(e) === false)
                    return;

                if (!e.children)
                    continue;

                if (e.children.length > 0) {
                    eleList.push(e);
                }
            }

            if (eleList.length == 0)
                return;

            elem = eleList.pop() as HTMLElement;
        }
    }

    /**
     * 将object转换为form表单格式字串
     * @param obj
     * @returns {string}
     */
    static objToForm(obj: any) {
        let ret = "";
        for (let k in obj) {
            ret += k + "=" + encodeURIComponent(obj[k]) + "&";
        }
        if (ret.length > 0)
            return ret.substr(0, ret.length - 1);

        return ret;
    }
}