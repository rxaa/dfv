"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("./dfvReact");
const dfvFront_1 = require("./dfvFront");
class dfvWindow {
    constructor() {
        /**
         * 是否显示红色错误提示样式
         * @type {boolean}
         */
        this.isError = false;
        /**
         * 关闭按钮点击事件回调
         */
        this.onButtonCancelClick = () => {
            this.close();
        };
        /**
         * 关闭窗口
         */
        this.close = () => {
            try {
                clearInterval(this.resizeTime);
                //窗口已关闭
                if (!this.divContent || !this.dialog) {
                    return;
                }
                if (this.divCover) {
                    try {
                        document.body.removeChild(this.divCover);
                    }
                    catch (e) {
                    }
                }
                this.divCover = null;
                this.divContent = null;
                let dia = this.dialog;
                this.dialog = undefined;
                if (window.history.pushState) {
                    dia.className += " anim_out";
                    setTimeout(() => {
                        //窗口已关闭
                        try {
                            document.body.removeChild(dia);
                        }
                        catch (e) {
                        }
                    }, 300);
                }
                else {
                    try {
                        document.body.removeChild(dia);
                    }
                    catch (e) {
                    }
                }
            }
            catch (e) {
                dfvFront_1.dfvFront.onCatchError(e);
            }
        };
        /**
         * 修正窗口大小与位置
         */
        this.reSize = () => {
            if (!this.dialog || !this.divContent)
                return;
            if (this.dialog.offsetWidth < document.documentElement.clientWidth) {
                let w = document.documentElement.clientWidth - this.dialog.offsetWidth;
                this.dialog.style.marginLeft = ((w >> 1) & (~3)) + "px";
            }
            this.divContent.style.maxWidth = document.documentElement.clientWidth - 40 + "px";
            if (this.dialog.offsetHeight < document.documentElement.clientHeight) {
                let h = (Math.floor((document.documentElement.clientHeight - this.dialog.offsetHeight) / 3));
                h = h & (~3);
                this.dialog.style.marginTop = h + "px";
            }
            this.divContent.style.maxHeight = document.documentElement.clientHeight - 45 + "px";
        };
        /**
         * 确定按钮的文字
         * @type {string}
         */
        this.buttonOkText = "确定";
        dfvWindow.coverZ++;
    }
    /**
     * 添加一个黑色半透明的遮盖层
     * @returns {dfvWindow}
     */
    addCover() {
        if (!this.divCover) {
            this.divCover = document.createElement("div");
            this.divCover.className = "cover_div cover_black";
            this.divCover.style.zIndex = dfvWindow.coverZ + "";
            document.body.appendChild(this.divCover);
        }
        return this;
    }
    /**
     * 处理PopWindowPara参数
     * @param para
     * @returns {dfvWindow}
     */
    procParas(para) {
        if (para && para.closeTime > 0) {
            this.autoClose(para.closeTime);
        }
        this.isError = para.isErr;
        if (!para.notCover)
            this.addCover();
        return this;
    }
    /**
     * 显示窗口
     * @param title 标题
     * @param content 内容
     * @returns {dfvWindow}
     */
    show(title, content) {
        if (this.dialog)
            return this;
        let c1 = this.isError ? "ba_tra_red" : "ba_tra_blue";
        let c2 = this.isError ? "icon_err" : "icon_close";
        this.dialog =
            React.createElement("div", { className: "pop_border anim_in " + c1 },
                this.divContent =
                    React.createElement("div", { className: "pop_cont" },
                        React.createElement("div", { className: "vmid pad5" }, title),
                        content ? React.createElement("div", { style: "margin-top: 10px" }, content) : null),
                React.createElement("div", { className: "absol_close" },
                    React.createElement("tt", { onclick: () => this.onButtonCancelClick(), className: "rotate_hover " + c2 })));
        this.dialog.style.zIndex = (dfvWindow.coverZ + 1) + "";
        document.body.appendChild(this.dialog);
        this.reSize();
        this.resizeTime = setInterval(this.reSize, 200);
        return this;
    }
    /**
     * 显示带一个【确定】按钮的窗口
     * @param title
     * @param content
     * @param onOk 按钮回调
     * @returns {dfvWindow}
     */
    showWithOk(title, content, onOk) {
        this.show(title, this.okWindow(content, onOk));
        return this;
    }
    /**
     * 将窗口设为自动关闭
     * @param time 自动关闭时间：毫秒
     * @returns {dfvWindow}
     */
    autoClose(time = 3000) {
        setTimeout(() => {
            this.close();
        }, time);
        return this;
    }
    okWindow(content, onOk) {
        return (React.createElement("div", null,
            React.createElement("div", null, content),
            React.createElement("div", { class: "h_m" },
                React.createElement("button", { class: "button_blue pad6-12 mar5t font_0 bold", onclick: e => onOk(e.currentTarget) }, this.buttonOkText))));
    }
}
dfvWindow.coverZ = 999;
exports.dfvWindow = dfvWindow;
//# sourceMappingURL=dfvWindow.js.map