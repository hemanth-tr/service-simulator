import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import AdminRouter from './routes/AdminRouter.js';
import ServiceRouter from './routes/ServiceRouter.js';
import LogRouter from './routes/LogRouter.js';
import mongoose from "mongoose";
import { LogManager } from './providers/LogManager.js';
import { LoggerStream } from './LoggerStream.js';
import ProviderRouter from './routes/ProviderRouter.js';
import config from './config.js'
import cors from 'cors'
import responseTime from 'response-time'
import rewrite from 'express-urlrewrite'
import fs from 'fs'
import path from 'path'

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public express: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();

    this.express.use((err: any, req, res, next) => {
      console.log('in error handler:')
      console.log(err)
      console.error(err.stack);
      LogManager.log('error', '' + err + ' stack:' + err.stack)
      res.status(500).send(err)
    })


    this.mongoSetup();
  }

  private mongoSetup(): void {
    if (config().app.provider === 'mongo') {
      mongoose.connect(config().app.mongoDbConnection, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(res => { console.log('mongodb connected') })
        .catch(err => { console.log('mongo error in connection:', err) });
    }
  }

  // Configure Express middleware.
  private middleware(): void {

    var urlrewriteFile = 'url-rewrite.json'
    if (config().app.provider === 'file') {
      var urlRewriteInFileProviderLocation = config().app.fileProviderLocation + path.sep + 'url-rewrite.json'
      console.log(`Looking for ${urlRewriteInFileProviderLocation} `)
      if (fs.existsSync(urlRewriteInFileProviderLocation)) {
        urlrewriteFile = urlRewriteInFileProviderLocation
      } else {
        console.log(`does not exist ${urlRewriteInFileProviderLocation} `)
      }
    }

    if (fs.existsSync(urlrewriteFile)) {
      console.log(`loading ${urlrewriteFile}`)
      JSON.parse(fs.readFileSync(urlrewriteFile, 'utf-8')).forEach(map => {
        console.log(`map: ${map.match} ${map.route}`)
        this.express.use(rewrite(map.match, map.route));
      });
    } else {
      console.log(`url rewrite not found: ${urlrewriteFile}`)
    }

    // timing
    this.express.use(responseTime(function (req, res, time) {
      if (time > config().app.responseLogLimit) {
        LogManager.logTimingMessage(`${req.method} ${req.url} ${time}\r\n`)
      }
    }))

    this.express.use(express.static('dashboard/dist/dashboard'))
    this.express.use(logger(':method :url :status :res[content-length] - :response-time ms', {
      stream: new LoggerStream()
    }));

    this.express.use(cors())
    // this.express.use(function (req, res, next) {
    //   res.header("Access-Control-Allow-Origin", "*");
    //   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //   next();
    // });

    // this interceptor is some of the service will append the additional info in the query. (fis: /fissignOnVS.signOnVSsoaphttps )
    this.express.use(function (req, res, next) {
      if (req.url.indexOf('admin') >= 0) {
        next()
        return		// don't do any pre process for admin calls.
      }

      var parts = req.url.split('/')
      req.url = '/' + parts[1]			// take only first part
      next();
    });

    // this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  // Configure API endpoints.
  private routes(): void {
    let router = express.Router();
    this.express.use('/api/v1/admin/provider', ProviderRouter);
    this.express.use('/api/v1/admin/logs', LogRouter);
    this.express.use('/api/v1/admin/services', AdminRouter);
    this.express.all("*", ServiceRouter);
  }
}

export default new App().express;