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
     * 是否可编辑
     */
    public editAble = false;

    /**
     * 绑定的属性名
     */
    public protoName = "";
}