import { Subject } from 'rxjs';
import IConnectionManager from './auth/i.connection.manager';
export default class OwservableClient extends Subject<any> {
    private readonly _connectionManager;
    private _ping;
    private _location;
    private _stores;
    private _subscriptions;
    private _timeout;
    constructor(connectionManager: IConnectionManager);
    disconnected(): void;
    private set location(value);
    consume(message: any): Promise<void>;
    ping(): void;
    private _processPong;
    private _checkSession;
    private removeSubscription;
    private reloadData;
    private updateSubscription;
    private isValidTarget;
    private sendDebugTargets;
    private clearSubscriptions;
}
