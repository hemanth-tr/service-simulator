import { Router, Request, Response, NextFunction } from 'express';
import debugx from 'debug';
let debug = debugx('providerrouter');
import config from '../config.js'

export class ProviderRouter {
    router: Router

    /**
     * Initialize the AdminRouter
     */
    constructor() {
        this.router = Router();
        this.init();
    }

    /**
     * GET all log requests.
     */
    private getProvider(req: Request, res: Response) {
        debug('enter getProvider.')
        var info = {
            provider: config().app.provider,
            path: ''
        }

        if (info.provider === 'file') {
            info.path = config().app.fileProviderLocation
        } else if (info.provider === 'inmemory') {
            info.path = config().app.inMemoryDataFile
        } else {
            info.path = 'mongodb:...'
        }

        res.send(info)
    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    init() {
        this.router.get('/', this.getProvider);
    }

}

// Create the AdminRouter, and export its configured Express.Router
const adminRoutes = new ProviderRouter();
adminRoutes.init();

export default adminRoutes.router;