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

export interface PopWindow {
    close();
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

    static onCatchError = (err: Error) => {
        dfvFront.msgErr(err + "", 10 * 1000);
        console.error(err);
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
        else if ((args as Node).localName !== void 0) {
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

    static appendJS(str: string, ele: HTMLElement) {
        let scriptRegExp = /<script[^>]*>((.|\n|\r)*?(?=<\/script>))<\/script>/ig;
        let result: RegExpExecArray|null = null;
        while ((result = scriptRegExp.exec(str)) != null) {
            var script = document.createElement("script");
            script.text = result[1];
            ele.appendChild(script);
        }
    }

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

}