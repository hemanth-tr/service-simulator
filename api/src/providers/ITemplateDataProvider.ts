export interface ITemplateDataProvider {
    getData(serviceName: string, dataname: string): string
}