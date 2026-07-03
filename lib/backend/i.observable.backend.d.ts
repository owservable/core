import { Observable } from 'rxjs';
export default interface IObservableBackend {
    target(): string;
    changes(): Observable<any>;
    find(query: any, fields: any, paging: any, sort: any, populates: any[]): Promise<any[]>;
    findOne(query: any, fields: any, populates: any[]): Promise<any>;
    findById(id: string, fields: any, populates: any[]): Promise<any>;
    count(query: any): Promise<number>;
    populate(document: any, populate: any): Promise<any>;
    toJSON(document: any): any;
    resolveVirtuals(document: any, virtuals: string[]): Promise<any>;
}
