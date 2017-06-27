import assert = require('assert');
import {sql} from "../../src/public/sql";
import {MongoBuilder} from "../../src/db/MongoBuilder";
import {db} from "../db";


class SqlBu {

    @sql.primaryKey
    tid = "";

    /**
     * 名字
     */
    name = "";

    /**
     * 值
     */
    val = 0;

    static mongo() {
        return new MongoBuilder(SqlBu, db.mongo);
    }


}

describe('mongo Test', function () {


    it('mongo build', function () {
        let res = SqlBu.mongo().where(f => (f.val.eq(2) | f.name.eq("aa")) & f.tid.eq("123") | f.val.gtEq(2)).getWhere();
        assert.equal(JSON.stringify(res), `{"$or":[{"$and":[{"$or":[{"val":2},{"name":"aa"}]},{"tid":"123"}]},{"val":{"$gte":2}}]}`);

        res = SqlBu.mongo().where(f => ((f.val.eq(2) | f.name.eq("aa")))).and(f => f.name.eq("bbb")).getWhere();
        assert.equal(JSON.stringify(res), `{"$and":[{"$or":[{"val":2},{"name":"aa"}]},{"name":"bbb"}]}`);
    });


});