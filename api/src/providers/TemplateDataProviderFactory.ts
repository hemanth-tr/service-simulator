import { ITemplateDataProvider } from "./ITemplateDataProvider.js";
import { InMemoryTemplateDataProvider } from "./InMemoryTemplateDataProvider.js";
import { FileProviderTemplateDataProvider } from "./FileProviderTemplateDataProvider.js";
import { MongoDbTemplateDataProvider } from "./MongoDbTemplateDataProvider.js";
import config from '../config.js'

export class TemplateDataProviderFactory {
    public static getTemplateDataProvider(): ITemplateDataProvider {
        if (config().app.provider === 'file') {
            return new FileProviderTemplateDataProvider(config().app.fileProviderLocation);
        } else if (config().app.provider === 'mongo') {
            return new MongoDbTemplateDataProvider()
        } else {
            return new InMemoryTemplateDataProvider(config().app.templateDataFilesLocation);
        }
    }
}