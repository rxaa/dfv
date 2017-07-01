import {valid} from "../../src/public/valid";
import {route} from "../../src/control/route";

export class TestReq1 {
    id = 1;

    name = "";

    @valid.int(r => r.val > 2, "val必须大于2")
    val = 0;

}

export class TestReq2 {
    id = 1;

    /**
     * 名字
     */
    name = "";



}