import * as _ from 'lodash';
import AStore from './a.store';
import IObservableBackend from '../backend/i.observable.backend';
export default class CollectionStore extends AStore {
    private _totalCount;
    constructor(backend: IObservableBackend, target: string);
    protected shouldReload(change: any): boolean;
    protected sendCount(subscriptionId: string): Promise<void>;
    protected delaySendCount: _.DebouncedFuncLeading<any>;
    protected loadIncremental(startTime: number, currentLoadSubscriptionId: string, change: any): Promise<void>;
    protected loadAll(startTime: number, currentLoadSubscriptionId: string): Promise<void>;
    protected load(change: any): Promise<void>;
    protected extractFromConfig(): void;
}
