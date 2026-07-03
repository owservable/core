import AStore from './a.store';
import IObservableBackend from '../backend/i.observable.backend';
export default class DocumentStore extends AStore {
    constructor(backend: IObservableBackend, target: string);
    protected extractFromConfig(): void;
    restartSubscription(): void;
    protected shouldReload(change: any): boolean;
    protected load(change: any): Promise<void>;
    private _pipeFilter;
    private _loadDocumentById;
    private _loadSortedFirstDocument;
    private _loadDocument;
}
