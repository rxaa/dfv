import * as https from 'https';
import { RequestOptions } from 'https';
import * as http from 'http';
import { ClientRequest, IncomingMessage } from 'http';
import * as url from 'url';
import { Url } from 'url';
import * as fs from 'fs';
import * as zlib from "zlib"
import { MapString } from "./public/dfv";
import { Readable } from "stream";

const agentkeepalive = require('agentkeepalive')


export interface IHttpHeaders {
    [header: string]: string | string[];
}

export interface RespContent {
    /**
     * http body内容
     */
    content: string;
    /**
     * http状态码
     */
    code: number;
    /**
     * 状态码消息
     */
    message: string;
    /**
     * 响应头
     */
    headers: IHttpHeaders;
}

export class HttpAgent {
    agent: http.Agent;

    // agents = new https.Agent({rejectUnauthorized: false}) as http.Agent;

    agents: any


    constructor(public maxSockets?: number, public keepAliveMsecs?: number) {
        if (maxSockets == null) {
            maxSockets = 5;
        }

        if (keepAliveMsecs == null) {
            keepAliveMsecs = 20 * 1000;
        }

        this.agent = new http.Agent({
            keepAlive: true,
            /**
             * 最大链接数
             */
            maxSockets: this.maxSockets,
            /**
             * 心跳时间间隔
             */
            keepAliveMsecs: this.keepAliveMsecs,
        })
        this.agents = new agentkeepalive.HttpsAgent({
            keepAliveMsecs: this.keepAliveMsecs,
            maxSockets: this.maxSockets,
        });
        this.agents.options.keepAliveMsecs = keepAliveMsecs;
        this.agents.options.maxSockets = maxSockets;
        this.agents.options.keepAliveTimeout = 1000 * 60 * 60 * 24;
        this.agents.options.timeout = this.agents.keepAliveTimeout * 2;
    }

}

export class HttpCookie {
    cookies = {} as MapString<MapString<string>>;

    /**
     * 从http响应头中获取cookie
     * @param host
     * @param header
     */
    setCookies(host: string, header: MapString<any>) {
        if (!header)
            return;

        let cookie = header["set-cookie"] as string | string[];
        if (!cookie)
            return;

        if (cookie instanceof Array) {
            cookie.forEach(it => {
                this.praseCookie(host, it)
            })
        }
        else if (cookie) {
            this.praseCookie(host, cookie);
        }
    }

    /**
     * 将cookie设置到请求头中
     * @param host
     * @param path
     */
    // setCookis(ht: dfvHttpClient) {
    //     ht.setHeader("Cookie", this.getCookisStr(ht.getHostName(), ""))
    // }

    getCookisStr(host: string, path?: string) {

        let cook: any = {};
        for (let c in this.cookies) {
            if (host.indexOf(c) >= 0) {
                let vals = this.cookies[c];
                for (let k in vals) {
                    cook[k] = vals[k]
                    // ret += k + "=" + vals[k] + "; "
                }
            }
        }
        // let vals = this.cookies[host];
        // if (!vals)
        //     return ""
        //
        //
        let ret = "";
        for (let k in cook) {
            ret += k + "=" + cook[k] + "; "
        }

        return ret.length > 1 ? ret.substr(0, ret.length - 2) : "";
    }

    private praseCookie(domain: string, cookie: string) {
        let arr = cookie.split(";")
        let host = "";
        let vals = Array<[string, string]>();
        for (let str of arr) {
            let val = str.split("=") as [string, string];
            if (val.length != 2)
                continue;
            let key = val[0].replace(" ", "").toLocaleLowerCase();
            if (key == "domain") {
                host = val[1];
                continue;
            }
            if (key == "path") {
                continue;
            }

            if (key == "expires") {
                continue;
            }
            vals.push(val);
        }

        if (!this.cookies[domain]) {
            this.cookies[domain] = {}
        }
        if (host.length > 0 && host != domain) {

            if (!this.cookies[host]) {
                this.cookies[host] = {}
            }

            for (let a of vals) {
                this.cookies[domain][a[0]] = a[1];
                this.cookies[host][a[0]] = a[1];
            }
        }
        else {
            for (let a of vals) {
                this.cookies[domain][a[0]] = a[1];
            }
        }


    }
}


/**
 * http客户端链接
 */
export class dfvHttpClient {

    static agent = new HttpAgent();

    cookie: HttpCookie | undefined;

    charset = "UTF-8";


    private options: RequestOptions = {
        hostname: "",
        port: 80,
        path: "",
        method: 'GET',
        headers: {},
    };

    /**
     * 开启cookie解析，默认关闭
     * @param able
     * @returns {dfvHttpClient}
     */
    enableCookie(able = true) {
        if (able)
            this.cookie = new HttpCookie();
        else
            this.cookie = undefined;
        return this;
    }

    getUrl() {
        return this.url.href
    }

    getHostName() {
        return this.options.hostname!;
    }

    getCookie(key: string) {
        if (!this.cookie)
            return "";

        let c = this.cookie.cookies[this.getHostName()];
        if (c)
            return c[key]
        return ""
    }

    getHeaders() {
        return this.options.headers! as IHttpHeaders;
    }

    private url: Url = {};
    static boundary = "QqxOjrnJnKZsMzD50plVIund0KyjL"

    isHttps() {
        return this.url.protocol === "https:";
    }

    isHttp() {
        return this.url.protocol === "http:";
    }

    /**
     * 每次请求的结果
     * @type {any}
     */
    resp: RespContent | null | undefined = null;


    agent = dfvHttpClient.agent;

    /**
     * 设置请求头信息
     * @param key
     * @param val
     * @returns {dfvHttpClient}
     */
    setHeader(key: string, val: string | number) {
        this.options.headers![key] = val;
        return this;
    }

    /**
     * 请求头相关
     */
    header = {
        set: (key: string, val: string): dfvHttpClient => {
            this.options.headers![key] = val;
            return this;
        },

        get: (key: string): string => this.options.headers![key] as string,

        /**
         * 设置multipart头
         */
        setMultipart: (): dfvHttpClient => this.setHeader("Content-Type", 'multipart/form-data; boundary=' + dfvHttpClient.boundary),

        setCookie: (val: string): dfvHttpClient => this.setHeader("Cookie", val),


        setOrigin: (val: string): dfvHttpClient => this.setHeader("Origin", val),

        setReferer: (val: string): dfvHttpClient => this.setHeader("Referer", val),

        setCharset: (val: string): dfvHttpClient => this.setHeader("Charset", val),

        setForm: (): dfvHttpClient => this.setHeader("Content-Type", 'application/x-www-form-urlencoded'),
        setContentLength: (len: number): dfvHttpClient => this.setHeader("Content-Length", len),

        setJson: (charset = "; charset=UTF-8"): dfvHttpClient => this.setHeader("Content-Type", 'application/json' + (charset ? charset : "")),

        setContentType: (val: string): dfvHttpClient => this.setHeader("Content-Type", val),

        remove: (key: string): dfvHttpClient => {
            delete this.options.headers![key]
            return this;
        },
    }

    /**
     * 重置url与header，保留cookie信息
     * @param host
     */
    setUrl(host: string) {
        let p = url.parse(host);
        this.url = p;
        this.options.hostname = p.hostname;
        this.options.protocol = p.protocol;
        if (p.port == null) {
            if (this.isHttp())
                this.options.port = 80;
            else if (this.isHttps()) {
                this.options.port = 443;
            }
        }
        else
            this.options.port = parseInt(p.port);

        this.options.path = p.path;

        if (this.isHttp()) {
            this.options.agent = this.agent.agent
        }
        else if (this.isHttps()) {
            // this.options.rejectUnauthorized = false;
            // this.options.agent = new https.Agent(this.options) as http.Agent;
            this.options.agent = this.agent.agents;
        }

        this.options.headers = {
            "Charset": this.charset
        }

        if (this.cookie) {
            let cookie = this.cookie.getCookisStr(p.hostname!);
            if (cookie.length > 0)
                this.header.setCookie(cookie)
        }
    }

    /**
     *
     * @param host url
     * @param agent   长链接属性
     */
    constructor(host?: string, agent?: HttpAgent) {

        if (agent)
            this.agent = agent;

        if (host && host != "") {
            this.setUrl(host);
        }

    }

    /**
     * 禁用https证书验证
     * @param reject
     */
    rejectUnauthorized(reject: boolean) {
        this.options.rejectUnauthorized = reject;
        // this.options.agent = new https.Agent(this.options) as http.Agent;
        // this.options.agent.maxSockets = 1;
    }

    setSSLcert(cert: Buffer, key: Buffer) {
        this.options.key = key;
        this.options.cert = cert;
    }


    setGet(): this {
        this.options.method = "GET";
        return this;
    }

    setPost(): this {
        this.options.method = "POST";
        return this;
    }


    public setKeepAlive(): this {
        this.options.headers!["Connection"] = 'Keep-Alive';
        return this;
    }

    public setAcceptGZIP(): this {
        this.options.headers!["Accept-Encoding"] = 'gzip';
        return this;
    }

    /**
     * 下载文件
     * @param toFile 存储目录
     * @param tempFile 是否创建临时文件
     * @returns {Promise<RespContent>}
     */
    download(toFile: string, tempFile = true): Promise<RespContent> {

        return new Promise<RespContent>((resolve: (dat: RespContent) => void, reject) => {
            let newFile = toFile + ".temp";
            let write = fs.createWriteStream(newFile);
            this.setGet();
            let error: any = null;
            let resContent = "";

            let reque = () => {
            }

            let cb = (res: IncomingMessage) => {
                if (res.statusCode == 302 && res.headers["location"]) {
                    this.setUrl(res.headers["location"] as string)
                    reque();
                    return;
                }

                if (res.statusCode != 200) {
                    resolve(this.setResp(toFile, res));
                    return;
                }

                let encode = res.headers["content-encoding"];

                let read: Readable = res;

                if (encode && encode.indexOf("gzip") >= 0) {
                    var gzip = zlib.createGunzip();
                    read = res.pipe(gzip);
                }
                read
                    .on("end", () => {
                        write.end();
                        if (error)
                            return;

                        fs.rename(newFile, toFile, err => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(this.setResp(toFile, res));
                        })
                    })
                    .on("error", (err: Error) => {
                        if (!error) {
                            error = err;
                            reject(err);
                        }

                    });
                write.on("error", (err: Error) => {
                    if (!error) {
                        error = err;
                        reject(err);
                    }
                });
                read.pipe(write);

            }

            reque = () => {
                if (this.isHttps()) {
                    var req = https.request(this.options, cb);
                }
                else {
                    var req = http.request(this.options, cb);
                }
                req.on('error', (err) => {
                    if (!error) {
                        error = err;
                        reject(err);
                    }
                });
                req.end();
            }
            reque();
        });

    }


    private setResp(content: string, resp: IncomingMessage) {
        return this.resp = {
            content: content,
            code: resp.statusCode || 500,
            headers: resp.headers as IHttpHeaders,
            message: resp.statusMessage || "",
        }
    }

    /**
     * 根据有无post参数，自动选择get或post
     * @param post
     * @returns {Promise<string>}
     */
    content(post?: string) {
        if (post)
            this.setPost();
        else
            this.setGet();
        return new Promise<string>((resolve: (dat: string) => void, reject) => {
            var chunks = Array();
            this.respContent(req => {
                if (post) {
                    // this.header.setContentLength(post.length)
                    req.end(post);
                }
            }, (dat, resp) => {
                if (dat) {
                    chunks.push(dat);
                }
                else {
                    let content = Buffer.concat(chunks).toString(this.charset);
                    this.setResp(content, resp);
                    if (resp.statusCode != 200)
                        reject(resp.statusCode + ":" + content);
                    else
                        resolve(content);
                }
            }, err => {
                reject(err);
            })
        });
    }

    /**
     * 获取get请求结果
     * @returns {Promise<RespContent>}
     */
    get(): Promise<RespContent> {
        this.setGet();
        return new Promise<RespContent>((resolve: (dat: RespContent) => void, reject) => {
            var chunks = Array();
            this.respContent(null, (dat, resp) => {
                if (dat) {
                    chunks.push(dat);
                }
                else {
                    resolve(this.setResp(Buffer.concat(chunks).toString(this.charset), resp));
                }
            }, err => {
                reject(err);
            })
        });
    }

    /**
     * 将object转换为form表单格式字串
     * @param obj
     * @returns {string}
     */
    static objToForm(obj: any) {
        let ret = "";
        for (let k in obj) {
            ret += k + "=" + encodeURIComponent(obj[k]) + "&";
        }
        if (ret.length > 0)
            return ret.substr(0, ret.length - 1);

        return ret;
    }

    /**
     * 获取post请求结果
     * @param dat
     * @returns {Promise<RespContent>}
     */
    post(dat: string): Promise<RespContent> {
        this.setPost();
        return new Promise<RespContent>((resolve: (dat: RespContent) => void, reject) => {
            var chunks = Array();
            this.respContent(req => {
                req.end(dat);
            }, (dat, resp) => {
                if (dat) {
                    chunks.push(dat);
                }
                else {
                    resolve(this.setResp(Buffer.concat(chunks).toString(this.charset), resp));
                }
            }, err => {
                reject(err);
            })
        });
    }

    private req: http.ClientRequest | undefined

    /**
     *
     * @param reqFunc http请求内容
     * @param func 响应内容，响应结束返回null
     * @param onErr 错误回调
     */
    private respContent(reqFunc: ((req: ClientRequest) => void) | null,
        func: (dat: Buffer | string | null, resp: IncomingMessage) => void,
        onErr?: (err: Error) => void) {

        let cb = (res: IncomingMessage) => {
            // res.setEncoding("binary");
            let encode = res.headers["content-encoding"];
            if (encode && encode.indexOf("gzip") >= 0) {
                var gzip = zlib.createGunzip();
                let pip = res.pipe(gzip);


                pip.on("data", (chunk: Buffer) => {
                    func(chunk, res);
                });

                pip.on("end", () => {
                    if (this.cookie && res) {
                        this.cookie.setCookies(this.getHostName(), res.headers)
                    }
                    func(null, res);
                });

                pip.on("error", (err: Error) => {
                    if (onErr)
                        onErr(err);
                })

                res.on("close", (err: Error) => {
                    console.error(err)
                    if (onErr)
                        onErr(err);
                })
                return;
            }
            res.on('data', chunk => {

                func(chunk, res);
            });
            res.on('end', () => {

                if (this.cookie && res) {
                    this.cookie.setCookies(this.getHostName(), res.headers)
                }

                func(null, res);
            });

            res.on("close", (err: Error) => {
                console.error(err)
                if (onErr)
                    onErr(err);
            })

            res.on("error", (err: Error) => {
                if (onErr)
                    onErr(err);
            })
        }

        if (this.isHttps()) {
            var req = https.request(this.options, cb);
        }
        else {
            var req = http.request(this.options, cb);
        }

        // req.on("close",()=>{
        //     console.error("close")
        // })
        //
        // req.on("drain",()=>{
        //     console.error("drain")
        // })
        req.on('error', function (e) {
            if (onErr)
                onErr(e);
        });

        this.req = req;
        if (reqFunc)
            reqFunc(req);
        req.end();
    }

    abort() {
        if (this.req)
            this.req.abort();
    }

}