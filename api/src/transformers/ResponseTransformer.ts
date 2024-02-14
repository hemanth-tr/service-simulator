import handlebars from 'handlebars'
import { HelperProvider } from "./HelpersProvider.js";
import { ITemplateDataProvider } from "../providers/ITemplateDataProvider.js";
import appDebug from 'debug'
var debug = appDebug('responsetransformer')

export class ResponseTransformer {

    constructor(public dataProvider: ITemplateDataProvider) {
        for (let [k, v] of HelperProvider.getHelpers()) {
            handlebars.registerHelper(k, v);
        }
    }

    public async transform(serviceName: string, request: string, response: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            var template = handlebars.compile(response)
            try {
                resolve(template({
                    request: request,
                    serviceName: serviceName,
                    dataProvider: this.dataProvider
                }))
            } catch (error) {
                debug('transform:' + error)
                reject(error)
            }
        })
    }
}