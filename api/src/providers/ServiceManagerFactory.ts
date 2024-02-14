import { ServiceManager } from "./ServiceManager.js";
import { InMemoryProvider } from "./InMemoryProvider.js";
import { ServicesFileProvider } from "./ServicesFileProvicer.js";
import { MongoDbProvider } from "./MongoDbProvider.js";
import { WrapperProvider } from "./WrapperProvider.js";
import appDebug from 'debug'
var debug = appDebug('servicemanagerfactory')
import config from '../config.js'

export namespace ServiceManagerFactory {
    export function createServiceManager(): ServiceManager {
        debug('enter createServiceManager:' + config().app.provider)
        var provider

        if (config().app.provider === 'file') {
            provider = new ServicesFileProvider(config().app.fileProviderLocation);
        } else if (config().app.provider === 'mongo') {
            provider = new MongoDbProvider();
        } else {
            provider = new InMemoryProvider(config().app.inMemoryDataFile)
        }

        return new WrapperProvider(provider)
    }
}
