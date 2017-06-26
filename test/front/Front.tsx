import * as React from '../../src/public/dfvReact'
import {dfvFront} from "../../src/public/dfvFront";
import {dfvBind} from "../../src/public/dfvBind";
import {valid} from "../../src/public/valid";
import {dfv} from "../../src/public/dfv";


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

    static dat = valid.bindAble({a: 1, b: "aa"})

    static view = () =>
        <div>
            <p>
                <input type="text" value={dfvBind(e => Front.dat.b, Front.notEmpty)}/>
                <span class="red"></span>
            </p>

            <p>
                <input type="text" value={dfvBind(e => Front.dat.a, Front.notEmpty)}/>
                <span class="red"></span>
            </p>
            <p>
                <button onclick={e => Front.onCheck()}>确定</button>
            </p>
            <p>
                {dfvBind(e => Front.dat.a + " - " + Front.dat.b)}
            </p>
        </div>

    private static async onCheck() {
        let res = await valid.checkAsync(Front.dat);
        dfvFront.alert(JSON.stringify(res) + "\r\n" + JSON.stringify(Front.dat))
    }
}