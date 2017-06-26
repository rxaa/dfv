"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const valid_1 = require("../../public/valid");
class TestReq1 {
    constructor() {
        this.id = 1;
        this.name = "";
        this.val = 0;
    }
}
__decorate([
    valid_1.valid.int(r => r.val > 2, "val必须大于2"),
    __metadata("design:type", Object)
], TestReq1.prototype, "val", void 0);
exports.TestReq1 = TestReq1;
class TestReq2 {
    constructor() {
        this.id = 1;
        /**
         * 名字
         */
        this.name = "";
    }
}
exports.TestReq2 = TestReq2;
//# sourceMappingURL=TestReq1.js.map