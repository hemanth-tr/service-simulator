// http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript/
// https://itnext.io/building-restful-web-apis-with-node-js-express-mongodb-and-typescript-part-1-2-195bdaf129cf
import http from 'http';
import https from 'https'
import debug from 'debug';
import fs from 'fs';
import config from './config.js';
import App from './App.js';

debug('ts-express:server');

const port = normalizePort(config().app.port);
const sslport = normalizePort(config().app.sslport);
App.set('port', port);

const server = http.createServer(App);
server.listen(port);
let portListening = true
server.on('error', onError);
server.on('listening', onListening);

var sslOptions = {
  key: fs.readFileSync(config().app.certname + '.key'),
  cert: fs.readFileSync(config().app.certname + '.crt'),
  passphrase: '1234'
};
const httpsServer = https.createServer(sslOptions, App)
httpsServer.listen(sslport)
let sslPortListening = true
httpsServer.on('error', onError);
httpsServer.on('listening', onHttpsListening);

function normalizePort(val: number | string): number | string | boolean {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  let sslbind = (typeof sslport === 'string') ? 'Pipe ' + sslport : 'Port ' + sslport;

  console.log('in onError...')
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      if (portListening == false) {
        console.error(`${bind} is already in use`);
      } else {
        console.error(`${sslbind} is already in use`);
      }
      process.exit(1);
      break;
    default:
      console.log('in default throwing error.')
      throw error;
  }
}

function onListening(): void {
  let addr = server.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`http listening on ${bind}`);
  console.log(`provider: ` + config().app.provider);
  if (config().app.provider === 'file') {
    console.log('`t file provider location:' + config().app.fileProviderLocation)
  }
  console.log('using stubservice domain.')
}

function onHttpsListening(): void {
  let addr = httpsServer.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`https listening on ${bind}`);
}

