import {MapNumber} from "./dfv";
import {dfvFront} from "./dfvFront";
export enum BindFieldType{
    string,
    number,
    boolean,
    array,
    object,
}


/**
 * 每个dfvBindDom对应一个绑定的html dom元素
 */
export class dfvBindDom {
    /**
     * 对应的dom
     */
    public html: HTMLElement;

    /**
     * 是否可编辑,用于valid.check时判断
     */
    public editAble = false;

    /**
     * 绑定的属性名
     */
    public protoName = "";

    /**
     * 是否由编辑html元素触发的onset事件
     */
    public isEditOnSet = false;

    constructor(//绑定的函数
        public bindFunc: (e: HTMLElement) => any,
        //是否取消双向绑定
        public cancelDoubleBind: boolean,
        /**
         * 验证函数
         */
        public onSet?: (val: any, bind: dfvBindDom, field: BindField) =>any) {

    }
}

/**
 * 每一个对象的属性对应一个BindField,一个属性可以绑定多个BindFunc也就是dom元素
 */
export class BindField {
    /**
     * 用于从对象get属性获取BindField
     * @type {any}
     */
    static getBindList: BindField[]|null = null;
    static bindListMap: MapNumber<boolean> = {};

    //初始化bind字段获取
    static initGetBindList(func: (list: BindField[])=>void) {
        let getBindListOld = BindField.getBindList;
        let bindListMapOld = BindField.bindListMap;
        BindField.getBindList = [];
        BindField.bindListMap = {}
        try {
            func(BindField.getBindList);
        }
        catch (e) {
            dfvFront.onCatchError(e);
        }
        finally {
            BindField.getBindList = getBindListOld;
            BindField.bindListMap = bindListMapOld;
        }

    }

    static autoId = 0;
    uniqueId = ++BindField.autoId;

    /**
     * 绑定的dom元素列表
     */
    public htmlBind = Array<dfvBindDom>();

    constructor(
        //绑定属性的值
        public val: any,
        //属性类型
        public type: BindFieldType,
        //属性名
        public fieldName?: string,
        //属性所属对象
        public parent?: any) {

    }

    /**
     * 属性监听函数列表
     */
    watcherLists: Array<(dat: any, ele: any, index: number)=>void> = [];

    addWatcherFunc(func: (dat: any, ele: any, index: number)=>void) {
        this.watcherLists.push(func);
    }


    /**
     * 收集以删除的元素监听
     * @type {Array}
     */
    // private removeList:number[] = [];

    /**
     *添加元素属性的监听函数
     * @param elem
     * @param key
     * @param bindFun
     */
    addWatcherElem(elem: HTMLElement, key: string, bindFun: dfvBindDom) {
        this.addWatcherFunc((v, e, ind)=> {
            //oninput自己触发的事件
            if (e === elem)
                return;
            //
            // if (ind === 0) {
            //     this.removeList.length = 0;
            // }
            //
            // //移除失效的元素
            // if (elem.parentElement == null) {
            //     elem.innerHTML = "";
            //     this.removeList.push(ind);
            // }
            //
            // if (ind === this.watcherLists.length - 1 && this.removeList.length > 0) {
            //     for (let i = this.removeList.length - 1; i >= 0; i--) {
            //         this.watcherLists.splice(this.removeList[i], 1);
            //     }
            //     this.removeList.length = 0;
            //     return;
            // }

            if (elem.parentElement == null) {
                return;
            }

            let retVal = bindFun.bindFunc(elem);
            if (key === "innerHTML") {
                dfvFront.setEle(elem, retVal);
                return;
            }

            if (elem.localName === "input" && (elem as HTMLInputElement).type === "radio" && key === "bind") {
                if ((elem as HTMLInputElement).value == retVal) {
                    (elem as HTMLInputElement).checked = true;
                }
                return;
            }

            if (retVal == null)
                elem[key] = "";
            else
                elem[key] = retVal;
        })

    }

    /**
     * 初始化可绑定对象
     * @param obj
     * @param parent 所属对象
     * @param field 字段名
     * @returns {any}
     */
    static init(obj: any, parent?: any, field?: string): void {
        let type = typeof obj;
        let f_a = new BindField(obj, BindFieldType.string, field, parent);
        if (obj == null || type === "string" || obj instanceof Date) {
            f_a.type = BindFieldType.string;
        }
        else if (type === "number") {
            f_a.type = BindFieldType.number;
        }
        else if (type === "boolean") {
            f_a.type = BindFieldType.boolean;
        }
        else if (type === "function") {
            return;
        }
        else if (obj instanceof Array) {

            (obj as any).__BindField__ = f_a;

            f_a.type = BindFieldType.array;
            for (let arr of obj) {
                BindField.init(arr)
            }

            let oldPush = obj.push;
            obj.push = function (val: any) {
                BindField.init(val);
                let ret = oldPush.call(obj, val);
                if ((obj as any).__BindField__)
                    ( (obj as any).__BindField__ as BindField).execWatcherList();
                return ret;
            }


            let oldSplice = obj.splice;
            obj.splice = function () {
                let ret = oldSplice.apply(obj, arguments);
                if ((obj as any).__BindField__)
                    ( (obj as any).__BindField__ as BindField).execWatcherList();
                return ret;
            }

            let sortOld = obj.sort;
            obj.sort = function (val: any) {
                let ret = sortOld.call(obj, val);
                if ((obj as any).__BindField__)
                    ( (obj as any).__BindField__ as BindField).execWatcherList();
                return ret;
            }


            let popOld = obj.pop;
            obj.pop = function () {
                let ret = popOld.call(obj);
                if ((obj as any).__BindField__)
                    ( (obj as any).__BindField__ as BindField).execWatcherList();
                return ret;
            }

        }
        else {
            f_a.type = BindFieldType.object;
            for (let k in obj) {
                if (typeof obj[k] === "function")
                    continue;

                BindField.init(obj[k], obj, k);
            }
        }


        if (parent && field) {

            delete parent[field];

            Object.defineProperty(parent, field, {
                get: function () {
                    if (BindField.getBindList && !BindField.bindListMap[f_a.uniqueId]) {
                        BindField.getBindList.push(f_a);
                        BindField.bindListMap[f_a.uniqueId] = true;
                    }

                    return f_a.getVal();
                },
                set: function (s) {
                    BindField.init(s);
                    f_a.setVal(s);
                },
                enumerable: true,
                configurable: true
            });
        }
    }


    toString() {
        return this.val + "";
    }

    valueOf() {
        return this.val;
    }

    toJSON() {
        return this.val;
    }


    getVal() {
        return this.val;
    }

    /**
     *
     * @param val
     * @param ele 附加数据，传递给setLists
     */
    setVal(val: any, ele?: any) {
        this.val = val;


        this.execWatcherList(ele);
    }

    execWatcherList(ele?: any) {
        for (let i = 0; i < this.watcherLists.length; i++) {
            this.watcherLists[i](this.val, ele, i);
        }

    }
}