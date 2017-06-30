# dfv

基于node.js与TypeScript的MVC框架。

同时支持Express与koa。

想要像c#.net mvc，LINQ一样做到从controller层到model与view层完全无硬编码，就只有使用TypeScript之类的强类型语言，并且可以获得强大的智能感知，大大提高开发效率与可维护性。这是原生js所无法实现的。

# 快速入门：

**安装：**

```shell
npm install dfv
```

本框架支持与原有的Express或Koa代码共存。

**先新建一个简单的controller类:**

```typescript
import {route} from "dfv";
import {valid} from "dfv/src/public/valid";

export class HomeController {

    /**
     * url为：/home/index
     * get请求，并接收一个id参数（会自动转换为number类型）
     */
    @route.get()
    async index(id: number) {
        //返回值作为response body
        return "index:" + id;
    }

    /**
     * /home/api
     * post请求，并且name参数不能为空
     */
    @route.post()
    async api(@valid.stringNotEmpty() name: string) {
        return "api:" + name;
    }

}
```

如上所示，和C#的`特性(attribute)`，或者java的`注解(annotation)`一样。TypeScript使用`装饰器(decorator)`，来描述接口的详细信息。只有装饰了@route.get或post的成员函数才能被外部访问。

**加载上面的controller类：**

```typescript
import {route} from "dfv";
import * as express from 'express';
import * as path from "path";

//express实例
var app = express();


/**
 * 加载controllers目录里的所有文件
 */
route.load(app, [{
  	
    //controllers目录
    menu: path.join(__dirname, 'controllers'),
  
    //拦截Controller中的每一次URL请求
    onRoute: async (dat) => {
        try {
    		if (!dat.valid.ok) {
                //参数校验失败后的行为
                dat.ctx.status = 500;
                dat.ctx.body = dat.valid.msg;
                return;
            }
            //next()即为调用controller类的成员函数
            let ret = await dat.router.next(dat);
            if (ret != null)
                dat.ctx.body = ret;
        } catch (e) {
            console.error(e)
            dat.ctx.status = 500;
            dat.ctx.body = "server error";
        }
    }
}]);
```

为了同时兼容koa，express的request与response参数被合并转换成了类似koa的context。

当使用koa时需要**node v7.6.0**以上版本。

而使用Express只需要**node v6.9.0**以上版本。

------

**配置好Express与TypeScript以及各目录结构的demo:**

https://github.com/rxaa/dfv-demo