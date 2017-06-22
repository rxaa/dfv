import * as React from './dfvReact'
import {dfvFront} from "./dfvFront";

export interface PopWindowPara {
    /**
     * 窗口关闭事件
     */
    onClose?: () => void | boolean;
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

    private dialog: HTMLDivElement | null;

    private divCover: HTMLDivElement | null;
    private divContent: HTMLDivElement | null;

    static coverZ = 999;

    constructor() {
        dfvWindow.coverZ++;
    }

    addCover() {
        if (!this.divCover) {
            this.divCover = document.createElement("div");
            this.divCover.className = "cover_div cover_black"
            this.divCover.style.zIndex = dfvWindow.coverZ + "";
            document.body.appendChild(this.divCover);
        }
        return this;
    }

    procParas(para: PopWindowPara) {
        if (para && para.closeTime! > 0) {
            this.autoClose(para.closeTime)
        }
        this.isError = para.isErr!!;
        if (para.onClose)
            this.onClose = para.onClose;
        if (!para.notCover)
            this.addCover();

        return this;
    }


    isError = false;

    public show(title: string | HTMLElement, content?: string | HTMLElement | null,) {
        if (this.dialog)
            return this;

        let c1 = this.isError ? "ba_tra_red" : "ba_tra_blue"
        let c2 = this.isError ? "icon_err" : "icon_close"
        this.dialog =
            <div className={"pop_border anim_in " + c1 }>
                {
                    this.divContent =
                        <div className="pop_cont">
                            <div className="vmid h_center pad5">
                                {title}
                            </div>
                            {content ? <div style="margin-top: 10px">{content}</div> : null}
                        </div>
                }
                <div className="absol_close">
                    <tt onclick={() => this.close()}
                        className={"rotate_hover " + c2}/>
                </div>
            </div>


        this.dialog!.style.zIndex = (dfvWindow.coverZ + 1) + "";

        document.body.appendChild(this.dialog!);
        this.reSize();
        this.resizeTime = setInterval(this.reSize, 200);
        return this;
    }

    public showWithOk(content: string | HTMLElement | null,
                      title: string | HTMLElement,
                      onOk: (e: HTMLElement) => void) {
        this.show(this.okWindow(content, onOk), title)
        return this;
    }

    onClose = (): boolean | void => {
        return true;
    }

    autoClose(time: number = 3000) {
        setTimeout(() => {
            this.close()
        }, time);
        return this;
    }

    close() {
        try {
            clearInterval(this.resizeTime);

            //窗口已关闭
            if (!this.divContent || !this.dialog) {
                return;
            }

            if (this.onClose() === false) {
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
            this.dialog = null;
            if (window.history.pushState) {
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


    private reSize = () => {
        if (!this.dialog || !this.divContent)
            return;

        if (this.dialog.offsetWidth < document.documentElement.clientWidth) {
            this.dialog.style.marginLeft = (Math.floor((document.documentElement.clientWidth - this.dialog.offsetWidth) / 2) | 3) + "px";
        }
        this.divContent.style.maxWidth = document.documentElement.clientWidth - 40 + "px";
        if (this.dialog.offsetHeight < document.documentElement.clientHeight) {
            this.dialog.style.marginTop = (Math.floor((document.documentElement.clientHeight - this.dialog.offsetHeight) / 3) | 3) + "px";
        }
        this.divContent.style.maxHeight = document.documentElement.clientHeight - 45 + "px";
    }

    private resizeTime: any;

    private okWindow(content: string | HTMLElement | null, onOk: (e: HTMLElement) => void) {
        return (
            <div>
                <div>
                    {content}
                </div>
                <div class="h_m">
                    <button class="button_blue pad6-12 mar5t font_0 bold" onclick={e => onOk(e.currentTarget)}>
                        确定
                    </button>
                </div>
            </div>
        )
    }
}