import { Service } from '../model/Service.js';
import { ProcessInfo } from '../model/ProcessInfo.js';
import { ProcessedRequest } from '../model/ProcessedRequest.js';
import { MapDetail } from '../model/MapDetail.js';
import { Request } from 'express';

export interface ServiceManager {
    getServices(): Promise<Service[]>;
    getService(name: string): Promise<Service>;
    addService(service: Service): Promise<void>;
    getMapDetail(name: string, mapName: string): Promise<MapDetail>;
    addNewResponse(name: string, mapDetail: MapDetail): Promise<boolean>;
    modifyNewResponse(name: string, mapDetail: MapDetail): Promise<boolean>;
    getResponse(name: string, request: string, req: Request): Promise<ProcessInfo>;
    logRequest(name: string, date: Date, status: number, processInfo: ProcessInfo): Promise<boolean>;
    getProcessedRequests(name: string): Promise<ProcessedRequest[]>
    getProcessedRequest(name: string, id: string): Promise<ProcessedRequest>
    clearProcessedRequests(name: string): Promise<boolean>
}