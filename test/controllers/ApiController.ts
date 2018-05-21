import { dfvContext } from "../../src/dfvContext";
import { route } from "../../src/control/route";
import { dfv } from "../../src/public/dfv";
export class ApiController {
    ctx!: dfvContext;


    @route.all()
    async test2() {

        return "ok";
    }
}