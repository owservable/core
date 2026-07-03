'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const store_factory_1 = __importDefault(require("./store/factories/store.factory"));
const data_middleware_map_1 = __importDefault(require("./middleware/data.middleware.map"));
class OwservableClient extends rxjs_1.Subject {
    constructor(connectionManager) {
        super();
        this._ping = 0;
        this._connectionManager = connectionManager;
        this._stores = new Map();
        this._subscriptions = new Map();
    }
    disconnected() {
        this.clearSubscriptions();
        this._connectionManager.disconnected();
        clearTimeout(this._timeout);
    }
    set location(location) {
        if (location === this._location)
            return;
        this._location = location;
        this._connectionManager.location(location);
    }
    consume(message) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (message.type) {
                case 'pong':
                    return this._processPong(message);
                case 'authenticate':
                    this._connectionManager.connected(message.jwt);
                    return this._checkSession();
                case 'location': {
                    const { path } = message;
                    this.location = path;
                    return;
                }
                case 'subscribe':
                    return this.updateSubscription(message);
                case 'unsubscribe':
                    return this.removeSubscription(message.target);
                case 'reload':
                    return this.reloadData(message.target);
            }
        });
    }
    ping() {
        this.next({ type: 'ping', id: new Date().getTime() });
        setTimeout(() => this.ping(), 60000);
    }
    _processPong(message) {
        const response = new Date().getTime();
        this._ping = response - message.id;
        this._connectionManager.ping(this._ping);
    }
    _checkSession() {
        return __awaiter(this, void 0, void 0, function* () {
            const check = yield this._connectionManager.checkSession();
            if (check)
                this.next(check);
            let refreshIn = (0, lodash_1.get)(check, 'refresh_in', 300000);
            refreshIn = Math.round((refreshIn * 95) / 100);
            clearTimeout(this._timeout);
            this._timeout = setTimeout(() => this._checkSession(), refreshIn);
        });
    }
    removeSubscription(target) {
        var _a, _b;
        (_a = this._subscriptions.get(target)) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        this._subscriptions.delete(target);
        (_b = this._stores.get(target)) === null || _b === void 0 ? void 0 : _b.destroy();
        this._stores.delete(target);
        this.sendDebugTargets('removeSubscription', target);
    }
    reloadData(target) {
        const store = this._stores.get(target);
        store.restartSubscription();
    }
    updateSubscription(subscriptionConfig) {
        const { target, scope, observe, config } = subscriptionConfig;
        let store = this._stores.get(target);
        if (store) {
            store.config = config;
        }
        else {
            store = (0, store_factory_1.default)(scope, observe, target);
            this._stores.set(target, store);
            const subscription = store.subscribe({
                next: (m) => __awaiter(this, void 0, void 0, function* () {
                    if (!this.isValidTarget(target))
                        return;
                    const process = data_middleware_map_1.default.getMiddleware(observe);
                    if (!process)
                        return this.next(m);
                    const r = yield process(m, this._connectionManager.user);
                    return this.next(r);
                }),
                error: (e) => this.error(e),
                complete: () => this.complete()
            });
            this._subscriptions.set(target, subscription);
            store.config = config;
        }
        this.sendDebugTargets('updateSubscription', target);
    }
    isValidTarget(target) {
        if (!this._stores)
            return false;
        const targets = Array.from(this._stores.keys());
        return (0, lodash_1.includes)(targets, target);
    }
    sendDebugTargets(event, target) {
        if (!this._stores)
            return false;
        const targets = Array.from(this._stores.keys());
        this.next({
            type: 'debug',
            id: new Date().getTime(),
            payload: {
                event,
                target,
                availableTargets: (0, lodash_1.join)(targets, ', ')
            }
        });
    }
    clearSubscriptions() {
        var _a, _b;
        if (this._subscriptions) {
            const subscriptionsKeys = this._subscriptions.keys();
            for (const subscriptionKey of subscriptionsKeys) {
                (_a = this._subscriptions.get(subscriptionKey)) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            }
            this._subscriptions.clear();
        }
        this._subscriptions = null;
        if (this._stores) {
            const storesKeys = this._stores.keys();
            for (const storeKey of storesKeys) {
                (_b = this._stores.get(storeKey)) === null || _b === void 0 ? void 0 : _b.destroy();
            }
            this._stores.clear();
        }
        this._stores = null;
        this.sendDebugTargets('clearSubscriptions', '*');
    }
}
exports.default = OwservableClient;
//# sourceMappingURL=owservable.client.js.map