import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Observable, throwError, Observer } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Config } from './Configuration';
import { MapDetail } from '../models/MapDetail';
import { Service } from '../models/Service';
import { ProcessedRequest } from '../models/ProcessedRequest';
import { ServiceResponseData } from '../models/ServiceResponseData';
import { SimulatedResponseData } from '../models/SimulatedResponseData';
import { Log } from '../models/Log';
import { Provider } from '../models/Provider';


@Injectable()
export class ApiService {
    Configuration: Config;
    constructor(private _http: HttpClient, private _location: Location) {
        this.Configuration = new Config();
    }

    getProvider(): Observable<Provider> {
        return this._http.get<Provider>(this.Configuration.getProviderInfoUrl()).pipe(
            tap(data => console.log('All: ' + JSON.stringify(data))),
            catchError(this.handleError),);
    }

    getServices(): Observable<Service[]> {
        return this._http.get<Service[]>(this.Configuration.adminServicesApiUrl).pipe(
            tap(data => console.log('All: ' + JSON.stringify(data))),
            catchError(this.handleError),);
    }

    getServiceDetails(name: string): Observable<Service> {
        console.log('getServiceDetails url:' + this.Configuration.getServiceDetailsUrl(name));
        return this._http.get<Service>(this.Configuration.getServiceDetailsUrl(name)).pipe(
            tap(data => console.log('All: ' + JSON.stringify(data))),
            catchError(this.handleError),);
    }

    submitRequest(service: string, request: string): Observable<ServiceResponseData> {
        const requestProcessingUrl = this.Configuration.getServiceSimulatorUrl(service);
        return this._http.post<ServiceResponseData>(requestProcessingUrl, request)
            .pipe(tap(data => console.log('received:' + data.status)),
                catchError(this.handleError));
    }

    addNewService(service: Service): Observable<any> {
        const addUrl = this.Configuration.getAddNewServiceUrl();
        console.log('adding service:' + JSON.stringify(service));
        return this._http.post<string>(addUrl, service)
            .pipe(tap(data => console.log('received')),
                catchError(this.handleError));
    }

    addNewResponse(service: string, info: SimulatedResponseData): Observable<any> {
        const addUrl = this.Configuration.getAddNewResponseUrl(service);
        console.log('posting to:' + addUrl);
        console.log('adding info:' + JSON.stringify(info));
        return this._http.post<string>(addUrl, info)
            .pipe(tap(data => console.log('received')),
                catchError(this.handleError));
    }

    getMapDetail(service: string, mapName: string): Observable<MapDetail> {
        const mapDetailUrl = this.Configuration.getMapDetailUrl(service, mapName);
        return this._http.get<MapDetail>(mapDetailUrl).pipe(
            tap(data => console.log('All: ' + JSON.stringify(data))),
            catchError(this.handleError),);
    }

    getLastRequests(service): Observable<ProcessedRequest[]> {
        const servedRequestUrl = this.Configuration.getProcessedRequests(service);
        return this._http.get<ProcessedRequest[]>(servedRequestUrl).pipe(
            tap(data => console.log('getLastRequests:')),
            catchError(this.handleError),);
    }

    clearLastRequests(name: string): Observable<any> {
        const servedRequestUrl = this.Configuration.getClearLastRequestUrl(name);
        return this._http.delete<any>(servedRequestUrl).pipe(
            tap(data => console.log('clearLastRequests:')),
            catchError(this.handleError),);
    }

    getProcessRequest(service, id): Observable<ProcessedRequest> {
        const servedRequestUrl = this.Configuration.getProcessedRequest(service, id);
        return this._http.get<ProcessedRequest>(servedRequestUrl).pipe(
            tap(data => console.log('getLastRequests:')),
            catchError(this.handleError),);
    }

    getLogs(): Observable<Log[]> {
        const logRequestUrl = this.Configuration.getLogRequestUrl();
        return this._http.get<Log[]>(logRequestUrl).pipe(
            tap(data => console.log('getLog:')),
            catchError(this.handleError),);
    }

    private handleError(err) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        let errorMessage = '';
        if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            errorMessage = `An error occurred: ${err.error.message}`;
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            const additionalMessage = JSON.stringify(err.error, null, '\t');
            errorMessage = `Server returned code: ${err},
                    error message is: ${err.message}
                    additional info: ${additionalMessage}`;
        }
        console.error(errorMessage);
        return throwError({ message: errorMessage, error: err });
    }
}
