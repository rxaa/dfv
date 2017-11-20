import * as React from '../../src/public/dfvReact'
import {dfvFront} from "../../src/public/dfvFront";
import {dfvBind, dfvBindDom} from "../../src/public/dfvBind";
import {valid} from "../../src/public/valid";
import {dfv} from "../../src/public/dfv";


function bindNotEmpty(func: (e: HTMLElement) => any) {
    return dfvBind(func, {
        onSet: Front.notEmpty,
        onError: dfvBindDom.showErrorToNextSpan,
    });
}

function bindNotEmpty2(func: (e: HTMLElement) => any) {
    return dfvBind(func, {
        onSet: val => {
            console.log("on set " + val);
            return val;
        },
        onError: dfvBindDom.showErrorToNextSpan,
    });
}

export class Front {
    static init() {
        dfvFront.setBody(Front.view())
    }


    static async notEmpty(val: any) {
        // await dfv.sleep(1000)
        if (val == null || val == 0 || val == "")
            throw dfv.err("不能为空");

        return val;
    }

    static dat = valid.bindAble({a: 1, b: "aa", c: ""})

    static view = () =>
        <div>
            <p>
                <input type="text" value={bindNotEmpty(e => Front.dat.b)}/>
                <span class="red"></span>
            </p>

            <p>
                <input type="text" value={bindNotEmpty(e => Front.dat.a)}/>
                <span class="red"></span>
            </p>
            <p>
                <button onclick={e => Front.onCheck()}>确定</button>
            </p>

            <p>
                {dfvBind(e => Front.dat.a + " - " + Front.dat.b)}
            </p>
            <p>
                <input type="text" value={bindNotEmpty2(e => Front.dat.c)}/>
                <span class="red"></span>
                <button onclick={e => {
                    Front.dat.c = "abc"
                }}>设置
                </button>
            </p>
        </div>

    private static async onCheck() {
        let res = await valid.checkAsync(Front.dat);
        dfvFront.alert(JSON.stringify(res) + "\r\n" + JSON.stringify(Front.dat))
    }
}