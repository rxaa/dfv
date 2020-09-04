import * as React from './dfvReact'
import { dfvFront } from "./dfvFront";

export interface PopWindowPara {
    /**
     * 是否不覆盖全屏
     */
    notCover?: boolean;
    /**
     * 是否显示红色背景的错误提示框
     */
    isErr?: boolean;

    /**
     * 自动关闭时间，为0则不自动关闭
     */
    closeTime?: number;
}

export class dfvWindow {

    //主窗口
    private dialog: HTMLDivElement | undefined;

    //cover层
    private divCover: HTMLDivElement | undefined;
    //内容层
    private divContent: HTMLDivElement | undefined;

    static coverZ = 999;

    constructor() {
        dfvWindow.coverZ++;
    }

    /**
     * 添加一个黑色半透明的遮盖层
     * @returns {dfvWindow}
     */
    addCover() {
        if (!this.divCover) {
            this.divCover = document.createElement("div");
            this.divCover.className = "cover_div cover_black"
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
    procParas(para: PopWindowPara) {
        if (para && para.closeTime! > 0) {
            this.autoClose(para.closeTime)
        }
        this.isError = para.isErr!!;
        if (!para.notCover)
            this.addCover();

        return this;
    }


    /**
     * 是否显示红色错误提示样式
     * @type {boolean}
     */
    isError = false;

    /**
     * 显示窗口
     * @param title 标题
     * @param content 内容
     * @returns {dfvWindow}
     */
    public show(title: string | HTMLElement, content?: string | HTMLElement | null) {
        if (this.dialog)
            return this;

        let c1 = this.isError ? "ba_tra_red" : "ba_tra_blue"
        let c2 = this.isError ? "icon_err" : "icon_close"
        this.dialog =
            <div className={"pop_border anim_in " + c1}>
                {
                    this.divContent =
                    <div className="pop_cont">
                        <div className="vmid pad5">
                            {title}
                        </div>
                        {content ? <div style="margin-top: 10px">{content}</div> : null}
                    </div>
                }
                <div className="absol_close">
                    <tt onclick={() => this.onButtonCancelClick()}
                        className={"rotate_hover " + c2} />
                </div>
            </div>


        this.dialog!.style.zIndex = (dfvWindow.coverZ + 1) + "";

        document.body.appendChild(this.dialog!);
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
    public showWithOk(title: string | HTMLElement,
        content: string | HTMLElement | null,
        onOk: (e: HTMLElement) => void) {
        this.show(title, this.okWindow(content, onOk))
        return this;
    }

    /**
     * 关闭按钮点击事件回调
     */
    onButtonCancelClick = () => {
        this.close();
    }


    /**
     * 将窗口设为自动关闭
     * @param time 自动关闭时间：毫秒
     * @returns {dfvWindow}
     */
    autoClose(time: number = 3000) {
        setTimeout(() => {
            this.close()
        }, time);
        return this;
    }

    /**
     * 关闭窗口
     */
    close = () => {
        try {
            clearInterval(this.resizeTime);

            //窗口已关闭
            if (!this.divContent || !this.dialog) {
                return;
            }

            if (this.divCover) {
                try {
                    document.body.removeChild(this.divCover);
                } catch (e) {
                }
            }
            this.divCover = null as any;
            this.divContent = null as any;
            let dia = this.dialog;
            this.dialog = undefined;
            if (window.history.pushState != null) {
                dia.className += " anim_out";
                setTimeout(() => {
                    //窗口已关闭
                    try {
                        document.body.removeChild(dia);
                    } catch (e) {
                    }
                }, 300)
            } else {
                try {
                    document.body.removeChild(dia);
                } catch (e) {
                }
            }
        } catch (e) {
            dfvFront.onCatchError(e)
        }

    }


    /**
     * 修正窗口大小与位置
     */
    private reSize = () => {
        if (!this.dialog || !this.divContent)
            return;

        if (this.dialog.offsetWidth < document.documentElement!.clientWidth) {
            let w = document.documentElement!.clientWidth - this.dialog.offsetWidth;
            this.dialog.style.marginLeft = ((w >> 1) & (~3)) + "px";
        }
        this.divContent.style.maxWidth = document.documentElement!.clientWidth - 40 + "px";
        if (this.dialog.offsetHeight < document.documentElement!.clientHeight) {
            let h = (Math.floor((document.documentElement!.clientHeight - this.dialog.offsetHeight) / 3));
            h = h & (~3);
            this.dialog.style.marginTop = h + "px";
        }
        this.divContent.style.maxHeight = document.documentElement!.clientHeight - 45 + "px";
    }

    private resizeTime: any;


    /**
     * 确定按钮的文字
     * @type {string}
     */
    buttonOkText = "确定";

    private okWindow(content: string | HTMLElement | null, onOk: (e: HTMLElement) => void) {
        return (
            <div>
                <div>
                    {content}
                </div>
                <div class="h_m">
                    <button class="button_blue pad6-12 mar5t font_0 bold" onclick={e => onOk(e.currentTarget)}>
                        {this.buttonOkText}
                    </button>
                </div>
            </div>
        )
    }
}