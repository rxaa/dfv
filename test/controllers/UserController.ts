import {route} from "../../src/control/route";
import {TestReq1} from "../models/TestReq1";
import {valid} from "../../public/valid";

export class UserController {

    @route.get("/test1-:id")
    test1(dat: TestReq1) {
        return dat;
    }

    @route.post("/test2-:id")
    test2(dat: TestReq1) {
        return dat;
    }

    @route.all("/test3")
    async test3(dat: TestReq1) {
        return dat;
    }


    @route.noAuth()
    @route.all()
    test4(@route.fromUrl id: number, @route.fromBody dat: TestReq1) {
        return "" + id + JSON.stringify(dat);
    }

    @route.all()
    test5(@valid.intNotZero()
          @route.fromBody id: number,
          @route.fromUrl dat: TestReq1) {
        return "" + id + JSON.stringify(dat);
    }

    @route.all()
    test6(@valid.stringNotEmpty()
          @route.fromBody id: string,
          @route.fromUrl dat: TestReq1) {
        return "" + id + JSON.stringify(dat);
    }
}