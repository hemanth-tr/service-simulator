import { Log } from "../model/Log.js";
import fs from "fs";
import path from "path";
import dateFormat from 'dateformat'
import appDebug from 'debug'
let debug = appDebug('logmanager')
// let logResponseTimeLimit = require('config').getConfig().responseLogLimit

export class LogManager {
    public static Logs: Log[] = []
    public static ErrorLogs: Log[] = []
    public static LogLimit = 50;
    public static TrimSize = 10;

    public static async log(type: string, message: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (type === 'error') {
                this.ErrorLogs.push(new Log(type, message))
                if (this.ErrorLogs.length > this.LogLimit) {
                    this.ErrorLogs = LogManager.ErrorLogs.slice(this.TrimSize)
                }
            } else {
                this.Logs.push(new Log(type, message))
                if (this.Logs.length > this.LogLimit) {
                    this.Logs = LogManager.Logs.slice(this.TrimSize)
                }
            }
            resolve()
        })
    }

    public static async getLogs(): Promise<Log[]> {
        return new Promise<Log[]>((resolve, reject) => {
            resolve(this.ErrorLogs.concat(this.Logs))
        })
    }

    public static async logTimingMessage(message): Promise<void> {
        var traceFile = this.getTraceLog()
        await fs.appendFile(traceFile, message, (error) => {
            debug('error' + error)
        })
    }

    private static getTraceLog() {
        var now = new Date();
        var date = dateFormat(now, "mm_dd");
        return process.cwd() + path.sep + `${date}_trace.txt`
    }
}