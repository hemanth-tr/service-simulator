export class ServiceResponseData {
    constructor(
        public status: number,
        public response: string,
        public matches: string[]
    ) {

    }
}