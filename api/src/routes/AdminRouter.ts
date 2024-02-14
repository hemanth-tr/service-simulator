import { Router, Request, Response, NextFunction } from 'express';
import { ServiceManagerFactory } from '../providers/ServiceManagerFactory.js';
import debugx from 'debug';
import { Log } from '../model/Log.js';
import { LogManager } from '../providers/LogManager.js';
let debug = debugx('adminrouter');

export class AdminRouter {
  router: Router

  /**
   * Initialize the AdminRouter
   */
  constructor() {
    this.router = Router();
    this.init();
  }

  /**
   * GET all services.
   */
  public async getAll(req: Request, res: Response, next: NextFunction) {
    var services = await ServiceManagerFactory.createServiceManager().getServices();
    services.forEach(s => s.url = req.protocol + '://' + req.get('host') + '/' + s.name)
    res.send(services);
  }

  /**
   * GET one service by name
   */
  public async getOne(req: Request, res: Response, next: NextFunction) {
    let name = req.params.name;
    var service = await ServiceManagerFactory.createServiceManager().getService(name)
    if (service) {
      res.status(200)
        .send(service);
    }
    else {
      res.status(404)
        .send({
          message: name + ' service not found.'
        });
    }
  }

  public async addService(req: Request, res: Response, next: NextFunction) {
    debug('enter addService')
    var requestData = await this.getRequest(req)
    debug('enter addService:' + requestData)
    var request = JSON.parse(requestData)
    if (request.name === undefined || request.name.length === 0) {
      res.status(404).send({ error: 'name cannot be empty.' })
      return
    }

    var foundService = await ServiceManagerFactory.createServiceManager().getService(request.name)
    debug('foundService:' + foundService)
    if (foundService !== undefined) {
      debug('foundservice. returning 422')
      res.status(422).send({

      })
    } else {
      await ServiceManagerFactory.createServiceManager().addService(request)
      res.status(200).send({
        name: request.name
      })
    }
  }
  public async getProcessedRequests(req: Request, res: Response) {
    let name = req.params.name;
    var processedRequests = await ServiceManagerFactory.createServiceManager().getProcessedRequests(name);
    res.send(processedRequests);
  }


  public async getProcessedRequestById(req: Request, res: Response) {
    let name = req.params.name;
    let id = req.params.id;

    try {
      var processedRequest = await ServiceManagerFactory.createServiceManager().getProcessedRequest(name, id);
      if (processedRequest !== undefined) {
        res.status(200).send(processedRequest)
      } else {
        console.log('returning 404')
        res.status(404).send({})
      }
    } catch (error) {
      debug('error:' + error)
      res.status(500).send(error)
    }
  }

  public async deleteProcessedRequests(req: Request, res: Response) {
    let name = req.params.name;
    var result = await ServiceManagerFactory.createServiceManager().clearProcessedRequests(name);
    if (result) {
      res.status(200).send([])
    } else {
      res.status(500).send([])
    }
  }

  public async getMapDetails(req: Request, res: Response) {
    debug('enter getMapDetail.')
    let serviceName = req.params.name;
    let mapName = req.params.mapName;

    try {
      var result = await ServiceManagerFactory.createServiceManager().getMapDetail(serviceName, mapName)
      if (result === undefined) {
        res.status(404).send({})
      } else {
        res.send(result)
      }
    } catch (error) {
      debug('getMapDetail error:' + error)
      res.status(500).send(error)
    }
  }

  public async testService(req: Request, res: Response) {
    let serviceName = req.params.name;
    try {
      var requestData = await this.getRequest(req);
      var processInfo = await ServiceManagerFactory.createServiceManager().getResponse(serviceName, requestData, req)
      if (processInfo === undefined) {
        res.send({
          status: 404
        })
      } else {
        res.send({
          status: 200,
          response: processInfo.response,
          matches: processInfo.matches
        })
      }
    } catch (error) {
      debug('error:' + error)
      res.send({
        status: 500,
        response: '' + error
      })
      LogManager.log('error', '' + error)

    }
  }

  public async addNewResponse(req: Request, res: Response) {
    let mapDetail = JSON.parse(await this.getRequest(req))
    debug('add new response:' + mapDetail)
    let name = req.params.name
    try {
      var status = await ServiceManagerFactory.createServiceManager().addNewResponse(name, mapDetail)
      if (status) {
        res.send({})
      } else {
        res.status(304).send({})
      }
    } catch (error) {
      debug('error:' + error)
      res.status(500).send({})
    }
  }

  public async modifyNewResponse(req: Request, res: Response) {
    let mapDetail = JSON.parse(await this.getRequest(req))
    debug('modify response:' + mapDetail)
    let name = req.params.name
    try {
      var status = await ServiceManagerFactory.createServiceManager().modifyNewResponse(name, mapDetail)
      if (status) {
        res.send({})
      } else {
        res.status(304).send({})
      }
    } catch (error) {
      debug('error:' + error)
      res.status(500).send({})
    }
  }

  private async getRequest(req: Request): Promise<string> {
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

  private async getLogs(req: Request): Promise<Log[]> {
    debug('enter getLogs')
    return new Promise<Log[]>((resolve, reject) => {
      var logs = []
      logs.push(new Log('error', 'some error'))
      resolve(logs)
    });
  }



  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  init() {
    this.router.get('/', this.getAll);
    this.router.post('/', async (req: Request, resp: Response) => {
      await this.addService(req, resp, null);
    });
    this.router.get('/:name', this.getOne)
    this.router.get('/:name/processedrequests', this.getProcessedRequests)
    this.router.get('/:name/logs', this.getLogs)
    this.router.get('/:name/processedrequests/:id', this.getProcessedRequestById)
    this.router.delete('/:name/processedrequests', this.deleteProcessedRequests)

    this.router.post('/:name/test', async (req: Request, resp: Response) => {
      await this.testService(req, resp);
    });

    this.router.get('/:name/maps/:mapName', this.getMapDetails)
    this.router.post('/:name/maps', async (req: Request, resp: Response) => {
      await this.addNewResponse(req, resp);
    });
    this.router.patch('/:name/maps', async (req: Request, resp: Response) => {
      await this.modifyNewResponse(req, resp);
    });
  }
}

// Create the AdminRouter, and export its configured Express.Router
const adminRoutes = new AdminRouter();
adminRoutes.init();

export default adminRoutes.router;