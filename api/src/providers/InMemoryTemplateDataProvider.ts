import { ITemplateDataProvider } from './ITemplateDataProvider.js';
import path from 'path'
import fs from 'fs'
import appDebug from 'debug'
const debug = appDebug('inmemorytemplatedataprovider')

export class InMemoryTemplateDataProvider implements ITemplateDataProvider {
    constructor(public dataFilesPath: string) {
        debug('dataFilesPath:' + this.dataFilesPath)
    }

    public getData(serviceName: string, dataname: string): string {
        var dataFile = this.dataFilesPath + path.sep + serviceName + '.' + dataname
        debug('dataFile:' + dataFile)
        if (!fs.existsSync(dataFile)) {
            return undefined
        }

        return fs.readFileSync(dataFile, 'utf-8')
    }
}