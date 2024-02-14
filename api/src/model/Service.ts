import { ServiceConfigMap } from "./ServiceConfigMap.js";

export class Service {
    constructor(public name: string,
        public type: string,
        public config: ServiceConfigMap[]
    ) {
    }

    public url: string
}