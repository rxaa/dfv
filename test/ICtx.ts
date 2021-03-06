import * as express from "express";
import * as Koa from "koa";
import {dfvContext} from "../src/dfvContext";

export interface ExpressCtx extends dfvContext {
    request: express.Request;
    response: express.Response;
}

export type KoaCtx = dfvContext & Koa.Context