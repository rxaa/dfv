import {dfvContext} from "../../src/dfvContext";
import {route} from "../../src/control/route";
export class ApiController {
    ctx: dfvContext;


    @route.all()
    async test2() {
        return "ok";
    }
}