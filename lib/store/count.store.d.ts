import AStore from './a.store';
import IObservableBackend from '../backend/i.observable.backend';
export default class CountStore extends AStore {
    constructor(backend: IObservableBackend, target: string);
    protected shouldReload(change: any): boolean;
    protected load(change: any): Promise<void>;
}
