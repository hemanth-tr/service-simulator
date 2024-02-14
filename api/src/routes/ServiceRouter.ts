import { Router, Request, Response, NextFunction } from 'express';
import { ServiceManagerFactory } from "../providers/ServiceManagerFactory.js";
import url from 'url'
import appDebug from 'debug'
var debug = appDebug('servicerouter')

export class ServiceRouter {
    router: Router

    /**
     * Initialize the ServiceRouter
     */
    constructor() {
        this.router = Router();
        this.init();
    }

    /** 
     * POST service
     */
    public async handle(req: Request, res: Response, next: NextFunction) {
        try {
            var requestData = await this.getRequest(req);

            let parsedUrl = url.parse(req.originalUrl);
            var urlParts = req.url.split('/')
            var serviceName = urlParts[urlParts.length - 1]
            // Add query string also as part of the post data.
            requestData += req.originalUrl
            requestData += parsedUrl.query == null ? "" : parsedUrl.query

            debug(`serviceName: ${serviceName}`)
            var serviceManager = ServiceManagerFactory.createServiceManager();

            var processInfo = await serviceManager.getResponse(serviceName, requestData, req);
            if (processInfo) {
                if (!processInfo.binary) {
                    res.status(200).
                        set({ 'content-type': processInfo.getResponseContentType() })
                        .send(processInfo.response)
                }
                else {
                    res.status(200).
                        send(Buffer.from(processInfo.response, 'binary'));
                }
            } else {
                res.status(404)
                    .send({
                        message: 'no match found.'
                    });
            }
        } catch (error) {
            debug('error:' + error)
            next(error)
        }
    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    init() {
        //   this.router.post('*', this.handle);
        this.router.all('*', async (req: Request, resp: Response, next: NextFunction) => {
            await this.handle(req, resp, next);
        });
    }

    async getRequest(req: Request): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            var requestData = JSON.stringify(req.body)
            if (requestData !== undefined && requestData.length > 2) {
                resolve(JSON.stringify(requestData));
            } else {
                requestData = '';
                req.on('data', chunk => {
                    requestData += chunk;
                });

                req.on('end', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(requestData);
                    }
                });
            }
        });
    }
}

// Create the ServiceRouter, and export its configured Express.Router
const serviceRoutes = new ServiceRouter();
serviceRoutes.init();

export default serviceRoutes.router;

