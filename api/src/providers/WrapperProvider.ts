import { InMemoryTemplateDataProvider } from './InMemoryTemplateDataProvider';
import { ServiceManager } from './ServiceManager';
import { Service } from '../model/Service';
import { ProcessInfo } from '../model/ProcessInfo';
import { ProcessedRequest } from '../model/ProcessedRequest';
import { MapDetail } from '../model/MapDetail';
import { ResponseTransformer } from '../transformers/ResponseTransformer';
import { TemplateDataProviderFactory } from './TemplateDataProviderFactory';
import { Request } from 'express';
import { clearScreenDown } from 'readline';
const config = require('./../config');
const debug = require('debug')('wrapperProvider')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class WrapperProvider implements ServiceManager {
    constructor(public innerProvider: ServiceManager,) {
    }

    public async getServices(): Promise<Service[]> {
        debug('enter getServices')
        var services = await this.innerProvider.getServices()
        services.forEach(s => {
            if (s.type === undefined || s.type == '') {
                s.type = 'soap' // default
            }
        })

        return services
    }

    public async getService(name: string): Promise<Service> {
        debug('enter getService')
        name = name.toLocaleLowerCase().trim()
        var service = await this.innerProvider.getService(name)
        if (service === undefined || service === null) {
            return undefined
        }
        if (service.type === undefined || service.type == '') {
            service.type = 'soap'
        }

        return service
    }

    public async addService(service: Service): Promise<void> {
        debug('enter addService')
        service.name = service.name.toLocaleLowerCase().trim()
        return await this.innerProvider.addService(service)
    }

    public async getMapDetail(name: string, mapName: string): Promise<MapDetail> {
        debug('enter getMapDetail')
        return await this.innerProvider.getMapDetail(name, mapName)
    }

    public async addNewResponse(name: string, mapDetail: MapDetail): Promise<boolean> {
        debug('enter addNewResponse')
        mapDetail.name = mapDetail.name.trim()
        var existing = await this.innerProvider.getMapDetail(name, mapDetail.name)
        if (existing !== undefined) {
            debug('detected exisitng and hence modifying...')
            return await this.modifyNewResponse(name, mapDetail)
        }
        return await this.innerProvider.addNewResponse(name, mapDetail)
    }

    public async modifyNewResponse(name: string, mapDetail: MapDetail): Promise<boolean> {
        debug('enter modifyNewResponse')
        mapDetail.name = mapDetail.name.trim()
        return await this.innerProvider.modifyNewResponse(name, mapDetail)
    }

    public async getResponse(name: string, request: string, req: Request): Promise<ProcessInfo> {
        debug('enter getResponse')

        try {
            var processInfo = await this.innerProvider.getResponse(name, request, req)
            if (processInfo !== undefined) {

                if (processInfo.sleep !== undefined) {
                    debug(`sleeping:${processInfo.sleep}`)
                    await sleep(processInfo.sleep)
                    debug(`sleeping done:${processInfo.sleep}`)
                }

                if (!processInfo.binary) {
                    // Transform for non binary only.
                    processInfo.response = await new ResponseTransformer(
                        TemplateDataProviderFactory.getTemplateDataProvider())
                        .transform(name, processInfo.request, processInfo.response)
                }
                await this.innerProvider.logRequest(name, new Date(), 200, processInfo);
            } else {
                clearScreenDown
                await this.logRequest(name, new Date(), 404, new ProcessInfo(request));
            }

            return processInfo
        } catch (error) {
            await this.logRequest(name, new Date(), 500, new ProcessInfo(request));
            throw error
        }
    }

    public async logRequest(name: string, date: Date, status: number, processInfo: ProcessInfo): Promise<boolean> {
        debug('enter logRequest')
        return await this.innerProvider.logRequest(name, date, status, processInfo)
    }

    public async getProcessedRequests(name: string): Promise<ProcessedRequest[]> {
        debug('enter getProcessedRequests')
        return await this.innerProvider.getProcessedRequests(name)
    }

    public async getProcessedRequest(name: string, id: string): Promise<ProcessedRequest> {
        debug('enter getProcessedRequest')
        return await this.innerProvider.getProcessedRequest(name, id)
    }

    public async clearProcessedRequests(name: string): Promise<boolean> {
        debug('enter clearProcessedRequests')
        return await this.innerProvider.clearProcessedRequests(name)
    }
}