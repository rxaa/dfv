import {FileMultiple, valid} from "../../src/public/valid";

export class TestFile {

    //一个普通字串属性
    title = "";

    //name为file1的文件类型（这个和以前的有点不一样，不是使用装饰器，而是直接赋值），客户端不传此参数，得到的就是null值
    upload?: FileMultiple = valid.file();

    //指定该文件不能为null,且长度大于0
    file2 = valid.file(r => r.val && r.val.size > 0, "file2不能为空");


}

export class TestFile2 {

    title = [{asss: "", ssss: ""}]
    /**
     * 文件数组，form表单里的name需要加上[]后缀：file3[]
     */
    upload = valid.fileArray(r => r.val.length > 0 && r.val.each(f => f.size > 0));
}