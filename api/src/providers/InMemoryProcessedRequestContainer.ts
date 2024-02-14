import { ProcessedRequest } from "../model/ProcessedRequest.js";

export class InMemoryProcessedRequestContainer {
    private static Logs: ProcessedRequest[] = []

    public static getLogs(): ProcessedRequest[] {
        return this.Logs;
    }

    public static clear() {
        this.Logs = []
    }

    public static add(log: ProcessedRequest) {
        this.Logs.push(log);
    }
}