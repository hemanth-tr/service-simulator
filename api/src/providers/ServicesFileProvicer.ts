import { ServiceManager } from './ServiceManager';
import { Service } from '../model/Service';
import { ProcessInfo } from '../model/ProcessInfo'; 56

import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { ServiceFileProvider } from './ServiceFileProvider';
import { ProcessedRequest } from '../model/ProcessedRequest';
import { ProcessLogFileManager } from './ProcessedLogFileManager';
import { MapDetail } from '../model/MapDetail';
import { Request } from 'express';
import { resolve } from 'dns';
var debug = require('debug')('servicesfileprovider')

export class ServicesFileProvider implements ServiceManager {
    constructor(public fileProviderLocation: string) {
    }

    public getServices(): Promise<Service[]> {
        debug('enter:getServices')
        debug('reading :' + this.getFilesProviderLocation() + '/*')

        return new Promise<Service[]>((resolve, reject) => {
            const dirs = glob.globSync(this.getFilesProviderLocation() + '/*');
            resolve(dirs.map(d => {
                var name = d.split('/').slice(-1)[0]
                var serviceInfo = new ServiceFileProvider(name, this.getFilesProviderLocation())
                return new Service(name, serviceInfo.type, serviceInfo.getConfigMap())
            }));
        });
    }

    public async getService(name: string): Promise<Service> {
        debug('enter:getService');
        var services = await this.getServices();
        return services.find(s => s.name.toLocaleLowerCase() == name.toLocaleLowerCase());
    }

    public async addService(service: Service): Promise<void> {
        await this.createNewService(service)
    }

    public async getMapDetail(name: string, mapName: string): Promise<MapDetail> {
        var serviceProvider = new ServiceFileProvider(name, this.getFilesProviderLocation());
        return await serviceProvider.getMapDetail(mapName);
    }

    public async addNewResponse(name: string, mapDetail: MapDetail): Promise<boolean> {
        var serviceProvider = new ServiceFileProvider(name, this.getFilesProviderLocation());
        return await serviceProvider.addNewResponse(mapDetail);
    }

    public async modifyNewResponse(name: string, mapDetail: MapDetail): Promise<boolean> {
        var serviceProvider = new ServiceFileProvider(name, this.getFilesProviderLocation());
        return await serviceProvider.addNewResponse(mapDetail);
    }

    public async getResponse(name: string, request: string, req: Request): Promise<ProcessInfo> {
        debug('enter:getResponse');

        var serviceProvider = new ServiceFileProvider(name, this.getFilesProviderLocation());
        var processInfo = await serviceProvider.getResponse(request, req);
        if (processInfo === undefined) {
            return undefined;
        }

        return processInfo;
    }

    getFilesProviderLocation(): string {
        return this.fileProviderLocation;
    }

    public async logRequest(name: string, date: Date, status: number, processInfo: ProcessInfo): Promise<boolean> {
        await new ProcessLogFileManager(name, this.getFilesProviderLocation()).writeLog(
            new ProcessedRequest(
                date,
                status,
                processInfo.name,
                processInfo.request,
                processInfo.response,
                processInfo.matches));
        return true;
    }

    public async getProcessedRequests(name: string): Promise<ProcessedRequest[]> {
        return await new ProcessLogFileManager(name, this.getFilesProviderLocation()).getLogs();
    }

    public async getProcessedRequest(name: string, id: string): Promise<ProcessedRequest> {
        return await new ProcessLogFileManager(name, this.getFilesProviderLocation()).getLog(id)
    }

    public async clearProcessedRequests(name: string): Promise<boolean> {
        await new ProcessLogFileManager(name, this.getFilesProviderLocation()).clearLogs();
        return true;
    }

    private async createNewService(service: Service): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                var serviceName = service.name
                // create directory
                var directory = this.getFilesProviderLocation() + path.sep + serviceName
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory);
                }

                var supportDirectories = ['config', 'requests', 'responses', 'logs']
                supportDirectories.forEach(d => {
                    var supportDirectory = directory + path.sep + d
                    if (!fs.existsSync(supportDirectory)) {
                        fs.mkdirSync(supportDirectory);
                    }
                })

                var mapFile = directory + path.sep + 'config' + path.sep + 'map.json'
                // create empty map file.
                if (!fs.existsSync(mapFile)) {
                    var serviceInfo = { type: service.type, maps: [] }
                    fs.writeFileSync(mapFile, JSON.stringify(serviceInfo, null, '\t'))
                }

                resolve(true)
            } catch (error) {
                reject(error)
            }
        })

    }
}