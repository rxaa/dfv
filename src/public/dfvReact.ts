/// <reference path="../reactExp.d.ts" />

import {BindField, BindFieldType, dfvBindDom} from "./dfvBind";
import {dfvFront} from "./dfvFront";
import {dfv} from "./dfv";


export const singleTag = {
    "meta": true,
    "img": true,
    "br": true,
    "hr": true,
    "link": true,
}


function setEleEvent(bindFun: dfvBindDom, event: string, elem: HTMLElement, key: string, bind: BindField[]) {
    let old = (elem as any)[event] as Function;
    (elem as any)[event] = (e: any) => {
        for (let b of bind) {
            if (b.type === BindFieldType.object || b.type === BindFieldType.array)
                continue;
            setBind(bindFun, b, elem, (elem as any)[key]);
        }
        if (old)
            old.call(elem, e);
    }
}

function setOnInputEvent(bindFun: dfvBindDom, elem: HTMLElement, key: string, bind: BindField[]) {
    let cpLock = false;
    elem.addEventListener('compositionstart', function () {
        cpLock = true;
    })
    elem.addEventListener('compositionend', function () {
        cpLock = false;

        for (let b of bind) {
            if (b.type === BindFieldType.object || b.type === BindFieldType.array)
                continue;
            setBind(bindFun, b, elem, (elem as any)[key]);
        }
    })
    let old = elem["oninput"];
    elem["oninput"] = (e) => {
        if (cpLock)
            return;

        for (let b of bind) {
            if (b.type === BindFieldType.object || b.type === BindFieldType.array)
                continue;
            setBind(bindFun, b, elem, (elem as any)[key]);
        }
        if (old)
            old.call(elem, e);
    }
}

function getVal(bind: BindField, val: any): any {
    if (bind.type === BindFieldType.number) {

        if (val === false)
            return 0;
        else if (val === true)
            return 1;
        else if (typeof val === "number")
            return val;
        else {
            let res = parseFloat(val);
            if (isNaN(res))
                return 0;
            else
                return res;
        }
    }
    else if (bind.type === BindFieldType.boolean)
        return Boolean(val);
    else
        return val + "";
}

function setVal(bind: BindField, val: any, elem: HTMLElement) {
    try {
        bind.setVal(val, elem);
    } catch (e) {
        dfvFront.onCatchError(e)
    }
}

function setBind(bindFun: dfvBindDom, bind: BindField, elem: HTMLElement, val: any) {
    if (bindFun.onSet) {
        bindFun.isEditOnSet = true;
        let res = getVal(bind, val);
        try {
            let ret = bindFun.onSet(res, bindFun, bind);

            if (ret instanceof Promise) {
                /**
                 * 异步验证不应该被频繁触发，待修订
                 */
                ret.then(r => setVal(bind, r, elem))
                    .catch(e => setVal(bind, res, elem))
                return;
            }

            res = ret;
        } catch (e) {
        }
        setVal(bind, res, elem);
    }
    else {
        bind.setVal(getVal(bind, val), elem);
    }
}

/**
 * 绑定属性
 * @param elem
 * @param key
 * @param bindFun
 */
function bindProt(elem: HTMLElement, key: string, bindFun: dfvBindDom) {
    bindFun.html = elem;
    let bindFields: BindField[] = []
    let ret;
    BindField.initGetBindList(list => {
        bindFields = list;
        ret = bindFun.bindFunc(elem);
    });

    if (bindFields.length < 1)//未找到可绑定对象
        return ret;

    bindFun.protoName = key;
    if (!bindFun.cancelDoubleBind) {
        if (elem.localName === "input" && key === "checked") {
            bindFun.editAble = true;
            setEleEvent(bindFun, "onclick", elem, "checked", bindFields);
        }
        else if (elem.localName === "input" && key === "value") {
            bindFun.editAble = true;
            setOnInputEvent(bindFun, elem, "value", bindFields);
        }
        else if (elem.localName === "input" && (elem as HTMLInputElement).type === "radio" && key === "bind") {
            bindFun.editAble = true;
            bindFun.protoName = "value";
            setEleEvent(bindFun, "onclick", elem, "value", bindFields);
            if ((elem as HTMLInputElement).value == ret)
                (elem as HTMLInputElement).checked = true;
        }
        else if (elem.localName === "select" && key === "value") {
            bindFun.editAble = true;
            setEleEvent(bindFun, "onchange", elem, "value", bindFields);
        }
    }


    //为每一个关联的属性添加addSetList
    for (let bind of bindFields) {
        bind.htmlBind.push(bindFun);
        bind.addWatcherElem(elem, key, bindFun);
    }


    return ret;
}

/**
 * 绑定InnerHtml
 * @param elem
 * @param bindFun
 */
function bindInnerHtml(elem: HTMLElement, bindFun: dfvBindDom) {
    bindFun.html = elem;
    let bindFields: BindField[] = []
    let ret;
    BindField.initGetBindList(list => {
        bindFields = list;
        ret = bindFun.bindFunc(elem);
    });

    if (bindFields.length < 1)
        return ret;

    if (elem.localName === "textarea") {
        bindFun.protoName = "value";
        bindFun.editAble = true;

        if (!bindFun.cancelDoubleBind) {
            setEleEvent(bindFun, "oninput", elem, "value", bindFields);
        }
        //为每一个关联的属性添加addSetList
        for (let bind of bindFields) {
            bind.htmlBind.push(bindFun);
            bind.addWatcherElem(elem, "value", bindFun);
        }
    }
    else {
        bindFun.protoName = "innerHTML";
        for (let bind of bindFields) {
            bind.addWatcherElem(elem, "innerHTML", bindFun);
        }
    }
    return ret;
}

declare var exports: any;

if (typeof window === "undefined") {
    exports.createElement = function createElement(ele: string, prot: any) {
        let ret = "";
        ret += "<" + ele + " ";

        //xml属性
        if (prot) {
            for (let k in prot) {
                ret += k + "=\"";
                if (prot[k] instanceof Function)
                    ret += dfv.getFuncBody(prot[k]);
                else
                    ret += prot[k];
                ret += "\" ";
            }
        }

        ret += ">"

        //xml内容
        if (arguments.length > 2) {
            for (let i = 2; i < arguments.length; i++) {
                let args = arguments[i]

                if (args != null) {
                    if (args instanceof Array)
                        args.forEach(it => {
                            if (it != null)
                                ret += it
                        })
                    else if (args instanceof Function) {
                        ret += dfv.getFuncBody(args)
                    }
                    else
                        ret += args;
                }

            }
        }

        if (!(singleTag as any)[ele])
            ret += "</" + ele + ">";
        return ret;
    }
}
else {
    exports.createElement = function createElement(ele: string, prot: any) {
        let elem = document.createElement(ele);
        //xml属性

        let value: string | null = null;
        if (prot) {
            for (let ke in prot) {
                let k = ke;
                if (ke == "class")
                    k = "className";

                let val = prot[ke];
                if (val instanceof dfvBindDom) {
                    val = bindProt(elem, k, val);
                }


                if (k == "bind")
                    continue;

                if (k == "style") {
                    procStyle(elem, val);
                    continue;
                }

                //保存旧事件
                let old = (elem as any)[k];
                if (typeof old === "function" && typeof val === "function") {
                    (elem as any)[k] = (e: any) => {
                        old.call(elem, e);
                        val.call(elem, e);
                    }
                }
                else {
                    if (ele === "select" && ke === "value")
                        value = val;
                    else
                        (elem as any)[k] = val;
                }

            }
        }

        //xml内容
        if (arguments.length > 2) {
            for (let i = 2; i < arguments.length; i++) {

                let args = arguments[i]
                if (args instanceof dfvBindDom) {
                    args = bindInnerHtml(elem, args);
                }
                dfvFront.addEle(elem, args);
            }
        }

        if (ele === "select" && value != null) {
            (elem as any)["value"] = value;
        }
        return elem;
    }
}


function procStyle(elem: HTMLElement, val: any) {
    if (typeof val === "string") {

        let styles = (val + "").split(";");
        for (let s of styles) {
            let vals = s.split(":");
            if (vals.length != 2)
                continue;
            (elem.style as any)[dfv.fixNameUpperCase(vals[0], "-", " ")] = vals[1];
        }
        return;
    }

    if (val instanceof Array) {
        for (let v of val) {
            for (let s in v) {
                (elem.style as any)[s] = procVal(s, v[s]);
            }
        }
        return;
    }

    for (let s in val) {
        (elem.style as any)[s] = procVal(s, val[s]);
    }
}

function procVal(k: string, val: any) {
    // if (typeof val === "number") {
    //     return val + "px"
    // }

    return val;
}