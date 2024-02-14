import { ITemplateDataProvider } from './../providers/ITemplateDataProvider.js';
import appDebug from 'debug'
const debug = appDebug('dataextractor')
export class DataExtractor {
    constructor(public dataProvider: ITemplateDataProvider,
        public serviceName: string,
        public input: string,
        public dataName: string,
        public match: string,
        public key: string) {
    }

    public getData(): string {
        debug('enter getData')
        var tags = this.match.split('|')
        console.log('this.input' + this.input)
        var matchValue = this.extract(this.input, tags[0], tags[1])
        if (matchValue === '') {
            debug('getData matchValue.empty')
            return ''
        }

        debug('getData: matchValue:' + matchValue)
        debug('getting dataProvider')
        var val = this.dataProvider.getData(this.serviceName, this.dataName)
        if (val === undefined) {
            return ''
        }

        console.log('data:' + val)
        var matchedRecord = val.split('\n').find(record => {
            var parts = record.split('|')
            console.log('parts-->' + parts[0])
            if (parts[0] === matchValue) {
                console.log('matched..')
                return true
            }
            return false
        })

        debug('matched record:' + matchedRecord)
        if (matchedRecord === undefined) {
            debug(`no match found: ${matchValue}`)
            return ''
        }

        var subParts = matchedRecord.split('|')
        if (subParts[1] === undefined) {
            return ''
        }
        console.log('subParts[1]:' + subParts[1])
        var keyValuePairs = subParts[1].replace('\r', '')
        var map = this.convertArrayToMap(keyValuePairs.split('='))

        return map[this.key]
    }

    private extract(input: string, start: string, end: string) {
        if (input === undefined || start === undefined || end === undefined) {
            return ''
        }

        var pos1 = input.indexOf(start)
        if (pos1 > 0) {
            console.log('pos1:' + pos1)
            var pos2 = input.indexOf(end, pos1 + 1);
            console.log('pos2:' + pos2)
            if (pos2 > 0) {
                return input.substr(pos1 + start.length, pos2 - pos1 - start.length)
            }
        }
        return ''
    }

    private convertArrayToMap(array): Map<string, string> {
        var map = new Map<string, string>()
        console.log('array length:' + array.length)
        for (var i = 0; i < array.length - 1; i++) {
            console.log('___-' + array[i])
            console.log('___-' + array[i + 1])
            map[array[i]] = array[i + 1]
        }

        return map
    }

}