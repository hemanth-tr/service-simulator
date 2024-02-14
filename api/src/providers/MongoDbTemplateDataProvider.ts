import { ITemplateDataProvider } from './ITemplateDataProvider.js';
import appDebug from 'debug'
const debug = appDebug('mongodbtemplatedataprovider')

export class MongoDbTemplateDataProvider implements ITemplateDataProvider {
    constructor() {
    }

    public getData(serviceName: string, dataname: string): string {
        return ''
    }
}