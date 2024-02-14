import { LogManager } from "./providers/LogManager.js";
import { Writable } from "stream";

export class LoggerStream extends Writable {
    public _write(chunk: string) {
        console.log(chunk);
        this.Log(chunk)
    }

    private async Log(message: string): Promise<void> {
        // color codes are there in the messages as they are used for console.
        //   message = message.replaceAll('\x1b\\[0m','')
        //   message = message.replaceAll('\x1b\\[32m','')
        await LogManager.log('status', message)
    }
}