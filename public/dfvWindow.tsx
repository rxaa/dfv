import * as React from './dfvReact'

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
}

export class dfvWindow {

    private popWindow(popID: number, content: string | HTMLElement | null, title?: string | HTMLElement, err?: boolean) {
        let c1 = err ? "ba_tra_red" : "ba_tra_blue"
        let c2 = err ? "icon_err" : "icon_close"
        return (

            <div id={"pop_windo" + popID}
                 className={"pop_border anim_in " + c1 }>
                <div id={"pop_cont" + popID} className="pop_cont">
                    <div className="vmid h_center">
                        <tt className="vmid" style="margin-right: 5px">{title}</tt>&nbsp;
                        <tt id={"pop_close" + popID}
                            className={"vmid rotate_hover " + c2}/>
                    </div>
                    {content ? <div style="margin-top: 10px">{content}</div> : null}
                </div>

            </div>
        )
    }


    private okWindow(content: string | HTMLElement | null, onOk: (e: HTMLElement) => void) {
        return (
            <div>
                <div>
                    {content}
                </div>
                <div class="h_m">
                    <button class="button_blue pad6-12 mar5t font_0 bold" onclick={e => onOk(e.currentTarget)}>确定
                    </button>
                </div>
            </div>
        )
    }
}