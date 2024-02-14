import { ServiceManager } from './ServiceManager.js';
import { Service } from '../model/Service.js';
import { ServiceSchema } from '../model/ServiceSchema.js';
import { ResponseSchema } from '../model/ResponseSchema.js';
import { RequestSchema } from '../model/RequestSchema.js';
import { LogRequestSchema } from '../model/LogRequestSchema.js';
import { ProcessInfo } from '../model/ProcessInfo.js';
import mongoose from "mongoose";
import { ProcessedRequest } from '../model/ProcessedRequest.js';
import { MapDetail } from '../model/MapDetail.js';
import { ServiceConfigMap } from '../model/ServiceConfigMap.js';
import { Request } from 'express';
import appDebug from 'debug'
const debug = appDebug('mongodbprovider')

const ServiceDbSchema = mongoose.model('services', ServiceSchema);
const ResponseDbSchema = mongoose.model('responses', ResponseSchema);
const RequestDbSchema = mongoose.model('requests', RequestSchema);
const LogRequestDbSchema = mongoose.model('logs', LogRequestSchema);


export class MongoDbProvider implements ServiceManager {
    public async getServices(): Promise<Service[]> {
        debug('enter getServices')
        return await ServiceDbSchema.collection.find({}).toArray();
    }

    public async getService(name: string): Promise<Service> {
        debug('enter getService:' + name)
        return await (ServiceDbSchema.collection.findOne({ name: name }))
    }

    public async addService(service: Service): Promise<void> {
        debug('addService:' + service.name)
        try {
            await ServiceDbSchema.collection.insertOne(service)
        } catch (e) {
            debug(e)
        }
    }

    public async getMapDetail(name: string, mapName: string): Promise<MapDetail> {
        debug('enter getMapDetail')
        var service = await this.getService(name)
        if (service === undefined) {
            debug('warn service ' + name + ' not found')
            return undefined
        }

        if (service.config === undefined) {
            debug('warn config for service ' + name + ' not found')
            return undefined
        }

        var foundConfig = service.config.find(c => c.name === mapName)
        if (foundConfig === undefined) {
            debug('warn match not found for service ' + name + ' for mapName ' + mapName)
            return undefined
        }

        var responseData = await this.getResponseData(name, mapName)
        var requestData = await this.getRequestData(name, mapName)
        return new MapDetail(mapName, requestData, responseData, foundConfig.method, foundConfig.matches, foundConfig.script)
    }

    public async addNewResponse(name: string, mapDetail: MapDetail): Promise<boolean> {
        debug('enter addNewResponse')
        var service = await this.getService(name)
        if (service === undefined) {
            debug('warn service ' + name + ' not found')
            return undefined
        }

        if (service.config === undefined) {
            service.config = []
        }

        var isUpdate = false
        var foundConfig = service.config.find(c => c.name == mapDetail.name)
        if (foundConfig === undefined) {
            service.config.push(new ServiceConfigMap(
                mapDetail.name,
                foundConfig.sleep,
                mapDetail.matches,
                mapDetail.method,
                mapDetail.script))
        } else {
            foundConfig.matches = mapDetail.matches
            isUpdate = true
        }

        return new Promise<boolean>((resolve, reject) => {
            debug('updating...')
            ServiceDbSchema.findOneAndUpdate({ name: name }, service, null, async (err) => {
                if (err) {
                    debug('error:' + err)
                    reject(err)
                } else {
                    debug('successfully updated config.')
                    if (isUpdate) {
                        await this.updateRequest(name, mapDetail.name, mapDetail.request)
                        await this.updateResponse(name, mapDetail.name, mapDetail.response)
                    } else {
                        await this.addRequest(name, mapDetail.name, mapDetail.request)
                        await this.addResponse(name, mapDetail.name, mapDetail.response)
                    }

                    debug('successfully updated.')
                    resolve(true)
                }
            })
        })
    }

    public async modifyNewResponse(name: string, mapDetail: MapDetail): Promise<boolean> {
        return await this.addNewResponse(name, mapDetail)
    }

    public async getResponse(name: string, request: string, req: Request): Promise<ProcessInfo> {
        debug('enter getResponse: ' + name)
        var service = await this.getService(name);

        if (service === undefined) {
            debug('warn: ' + name + ' not found.');
            return undefined;
        } else if (service.config === undefined) {
            debug('warn: ' + name + ' config not found.');
            return undefined;
        }

        var foundConfig = service.config.find(c => {
            if (c.matches === undefined) {
                return false;
            }

            return c.matches.every(m => request.includes(m));
        });

        if (foundConfig === undefined) {
            debug('warn: matching not found.');
            return undefined;
        }
        debug('foundConfig:' + JSON.stringify(foundConfig));

        var responseNameKey = name + "_response_" + foundConfig.name;
        debug('reading mongodb:' + responseNameKey);
        return new Promise<ProcessInfo>((resolve, reject) => {
            ResponseDbSchema.find({
                name: responseNameKey
            }, (err, response) => {
                if (err) {
                    debug('warn:' + err);
                    reject(err);
                } else {
                    if (response.length == 0) {
                        resolve(undefined)
                        return
                    }

                    var processInfo = new ProcessInfo(request);
                    processInfo.type = service.type
                    processInfo.matches = foundConfig.matches;
                    processInfo.response = response.toString();
                    resolve(processInfo);
                }
            })
        });
    }

    public async logRequest(name: string, date: Date, status: number, processInfo: ProcessInfo): Promise<boolean> {
        debug('enter logRequest')
        var matches = ''
        if (processInfo.matches !== undefined) {
            matches = processInfo.matches.join(',')
        }
        await LogRequestDbSchema.collection.insertOne(
            {
                name: name,
                date: date,
                status: status,
                request: processInfo.request,
                response: processInfo.response,
                matches: matches
            });
        return true;
    }

    public async getProcessedRequests(name: string): Promise<ProcessedRequest[]> {
        debug('enter getProcessedRequests:' + name)
        var results = []
        var response = await LogRequestDbSchema.collection.find({
            name: name
        }).toArray();

        response.forEach(r => {
            var processRequest = new ProcessedRequest(r.date, r.status, r.name, r.request, r.response, r.matches)
            processRequest.id = r._id
            results.push(processRequest);
        });

        return results;
    }

    public async getProcessedRequest(name: string, id: string): Promise<ProcessedRequest> {
        var processedRequest = await LogRequestDbSchema.findById(id)
        if (processedRequest !== undefined) {
            var processRequest = new ProcessedRequest(
                processedRequest.date,
                processedRequest.status,
                processedRequest.name,
                processedRequest.request,
                processedRequest.response, processedRequest.matches)
            processRequest.id = id
            return processRequest
        }

        return undefined
    }

    public async clearProcessedRequests(name: string): Promise<boolean> {
        await LogRequestDbSchema.collection.remove({
            name: name
        });

        return true;
    }

    private async getResponseData(name: string, mapName: string): Promise<string> {
        var responseNameKey = name + "_response_" + mapName;
        debug('getResponseData: ' + responseNameKey)
        var responses = await ResponseDbSchema.find({
            name: responseNameKey
        });

        if (responses.length > 0) {
            return responses[0].response
        }

        return undefined
    }

    private async getRequestData(name: string, mapName: string): Promise<string> {
        var requestNameKey = name + "_request_" + mapName;
        var requests = await RequestDbSchema.find({
            name: requestNameKey
        });

        if (requests.length > 0) {
            return requests[0].request
        }

        return undefined
    }

    public async addRequest(name: string, mapName: string, request: string): Promise<boolean> {
        var requestNameKey = name + "_request_" + mapName;
        debug('addRequest updated.')
        debug('adding request:' + requestNameKey)
        return new Promise<boolean>((resolve, reject) => {
            RequestDbSchema.collection.insertOne({ name: requestNameKey, request: request }, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    debug('addRequest updated.')
                    resolve(true)
                }
            });
        })
    }

    public async updateRequest(name: string, mapName: string, request: string): Promise<boolean> {
        var requestNameKey = name + "_request_" + mapName;
        debug('addRequest updated.')
        debug('adding request:' + requestNameKey)
        return new Promise<boolean>((resolve, reject) => {
            RequestDbSchema.update({ name: requestNameKey }, { name: requestNameKey, request: request }, null, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    debug('addRequest updated.')
                    resolve(true)
                }
            });
        })
    }

    public async addResponse(name: string, mapName: string, response: string): Promise<boolean> {
        var responseNameKey = name + "_response_" + mapName;
        debug('adding response:' + responseNameKey)
        return new Promise<boolean>((resolve, reject) => {
            ResponseDbSchema.collection.insertOne({ name: responseNameKey, response: response }, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(true)
                }
            });
        })
    }

    public async updateResponse(name: string, mapName: string, response: string): Promise<boolean> {
        var responseNameKey = name + "_response_" + mapName;
        debug('adding response:' + responseNameKey)
        return new Promise<boolean>((resolve, reject) => {
            ResponseDbSchema.collection.update({ name: responseNameKey }, { name: responseNameKey, response: response }, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(true)
                }
            });
        })
    }
}