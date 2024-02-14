import { ITemplateDataProvider } from './../providers/ITemplateDataProvider.js';
import dateformat from 'dateformat'
import { DataExtractor } from './DataExtractor.js';
import appDebug from 'debug'
const debug = appDebug('handlebarhelpers')

export class HelperProvider {

    private static extract(input: string, start: string, end: string) {
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

    private static dataExtractor(context) {
        debug('data extractor...')
        var dataname = ''
        if (context.hash['dataname']) {
            dataname = context.hash['dataname']
        } else {
            return ''       // no data.
        }

        var match = ''
        if (context.hash['match']) {
            match = context.hash['match']
        } else {
            return ''       // no match.
        }

        var key = ''
        if (context.hash['key']) {
            key = context.hash['key']
        } else {
            return ''       // no key.
        }

        console.log(`data: ${dataname} match:${match} key:${key}`)
        let dataProvider: ITemplateDataProvider = context.data.root.dataProvider
        if (dataProvider === undefined) {
            return ''
        }

        var request = context.data.root.request
        var serviceName = context.data.root.serviceName
        return new DataExtractor(dataProvider, serviceName, request, dataname, match, key).getData()
    }

    static getHelpers(): Map<string, any> {
        let map = new Map<string, any>();

        map.set('random', function (context) {
            debug('enter random helper')
            var min = 0
            if (context.hash["min"]) {
                min = context.hash['min']
            }
            var max = 1000000
            if (context.hash['max']) {
                max = context.hash['max']
            }

            return Math.floor(Math.random() * (max - min + 1)) + min;
        })

        map.set('date', function (context) {
            debug('enter date helper')
            var format = 'yyyy-mm-dd'
            if (context.hash["format"]) {
                format = context.hash['format']
            }
            var days = 0
            if (context.hash['days']) {
                days = +context.hash['days']
            }

            var date = new Date();
            var newDate = date.setDate(date.getDate() + days);
            var formattedDate = dateformat(newDate, format)
            return formattedDate;
        })


        map.set('request', function (context) {
            debug('enter request helper')

            if (context.hash['tags'] === undefined) {
                debug('no tags found in context.')
                return ''
            }

            var tags = context.hash['tags']
            debug(`tags: ${tags}`)
            var [start, end] = tags.split('|')

            debug(`in request processor start: ${start}  end:${end}.`)
            if (start === undefined || end === undefined) {
                return ''
            }

            var data = context.data
            console.log('request:' + data.root.request)
            return HelperProvider.extract(data.root.request, start, end)
        })

        map.set('dataextract', context => {
            return HelperProvider.dataExtractor(context)
        })

        return map
    }
}