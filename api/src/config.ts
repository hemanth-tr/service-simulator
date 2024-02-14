import fs from 'fs'
import path from 'path'

// config.js
const env = process.env.NODE_ENV || "dev"; // 'dev' or 'prod' or 'azure'

const dev = {
    app: {
        port: process.env.PORT || 3000,
        sslport: process.env.SSLPORT || 3443,
        certname: process.env.CERTNAME || 'stubservices',
        provider: process.env.PROVIDER || 'inmemory',
        inMemoryDataFile: process.env.INMEMORY_DATAFILE || (process.cwd() + path.sep + 'data/inmemory/testdata.json'),
        mongoDbConnection: process.env.MONGODB_CONNECTION || 'mongodb://127.0.0.1:27017/simulator',
        fileProviderLocation: process.env.FILEPROVIDER_LOCATION || (process.cwd() + path.sep + `data${path.sep}fileprovider`),
        templateDataFilesLocation: process.env.TEMPLATEDATAFILES_LOCATION || (process.cwd() + path.sep + 'data/inmemory'),
        responseLogLimit: process.env.LOG_THRESHOLD_TIME_LIMIT || 3000
    }
};

const prod = {
    app: {
        port: process.env.PORT || 3000,
        sslport: process.env.SSLPORT || 3443,
        certname: process.env.CERTNAME || 'stubservices',
        provider: process.env.PROVIDER || 'file',
        inMemoryDataFile: process.env.INMEMORY_DATAFILE || (process.cwd() + path.sep + 'data/inmemory/testdata.json'),
        mongoDbConnection: process.env.MONGODB_CONNECTION || 'mongodb://127.0.0.1:27017/simulator',
        fileProviderLocation: process.env.FILEPROVIDER_LOCATION || (process.cwd() + path.sep + `data${path.sep}fileprovider`),
        templateDataFilesLocation: process.env.TEMPLATEDATAFILES_LOCATION || (process.cwd() + path.sep + 'data/inmemory'),
        responseLogLimit: process.env.LOG_THRESHOLD_TIME_LIMIT || 3000
    }
};

const azure = {
    app: {
        port: process.env.PORT || 80,
        sslport: process.env.SSLPORT || 3443,
        certname: process.env.CERTNAME || 'stubservices',
        provider: process.env.PROVIDER || 'mongo',
        inMemoryDataFile: process.env.INMEMORY_DATAFILE || (process.cwd() + path.sep + 'data/inmemory/testdata.json'),
        mongoDbConnection: process.env.MONGODB_CONNECTION || 'mongodb://127.0.0.1:27017/simulator',
        fileProviderLocation: process.env.FILEPROVIDER_LOCATION || (process.cwd() + path.sep + `data${path.sep}fileprovider`),
        templateDataFilesLocation: process.env.TEMPLATEDATAFILES_LOCATION || (process.cwd() + path.sep + 'data/inmemory'),
        responseLogLimit: process.env.LOG_THRESHOLD_TIME_LIMIT || 3000
    },
};

const config = {
    dev,
    prod,
    azure
};

export default function getConfig(): any {
    var current = config[env];
    if (current === undefined) {
        console.error('envionrment not set. please set NODE_ENV with one of (dev/prod/azureprod)')
        process.exit(-99)
    }

    if (current.app.provider == undefined) {
        console.log('Provider was not set.please set by PROVIDER environment ( inmemory,file,mongo)')
        process.exit(-98)
    }

    if (current.app.provider == 'mongo') {
        console.log(current.app.mongoDbConnection)
        if (current.app.mongoDbConnection === undefined || current.app.mongoDbConnection.length === 0) {
            console.error('provider is \"mongo\" but no connection string was specified. specify MONGODB_CONNECTION environment variable.')
            process.exit(-97)
        }
    }

    if (current.app.provider == 'file') {
        if (current.app.fileProviderLocation === undefined || current.app.fileProviderLocation.length === 0) {
            console.error('provider is \"file\" but no files location was specified. specify FILEPROVIDER_LOCATION environment variable.')
            process.exit(-96)
        }

        // change the template path to file provider location
        current.app.templateDataFilesLocation = current.app.fileProviderLocation
        // todo: directory existig.

    }

    if (current.app.provider == 'inmemory') {
        if (current.app.inMemoryDataFile === undefined || current.app.inMemoryDataFile.length === 0) {
            console.error('provider is \"inmemory\" but no files location was specified. specify INMEMORY_DATAFILE environment variable.')
            process.exit(-95)
        }

        if (!fs.existsSync(current.app.inMemoryDataFile)) {
            console.error(`provider is \"inmemory\" file ${current.app.inMemoryDataFile} does not exist.`)
            process.exit(-94)
        }
    }

    return current;
}