import { Router, Request, Response, NextFunction } from 'express';
import { ServiceManagerFactory } from '../providers/ServiceManagerFactory.js';
import debugx from 'debug';
import { LogManager } from '../providers/LogManager.js';
let debug = debugx('logrouter');

export class LogRouter {
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
  public async getAll(req: Request, res: Response, next: NextFunction) {
    debug('enter getAll')
    res.status(200).send(await LogManager.getLogs())
  }

  public async deleteAll(req: Request, res: Response) {
    let name = req.params.name;
    var result = await ServiceManagerFactory.createServiceManager().clearProcessedRequests(name);
    if (result) {
      res.status(200).send([])
    } else {
      res.status(500).send([])
    }
  }

  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  init() {
    this.router.get('/', this.getAll);
    this.router.delete('/', this.deleteAll);
  }

}

// Create the AdminRouter, and export its configured Express.Router
const adminRoutes = new LogRouter();
adminRoutes.init();

export default adminRoutes.router;