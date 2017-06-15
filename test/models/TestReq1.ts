import {valid} from "../../public/valid";
export class TestReq1 {
    id = 1;

    name = "";

    @valid.int(r => r.val > 2, "val必须大于2")
    val = 0;
}