'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sift_1 = __importDefault(require("sift"));
const node_crypto_1 = require("node:crypto");
const node_module_1 = require("node:module");
const lodash_1 = require("lodash");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const store_type_enum_1 = __importDefault(require("../enums/store.type.enum"));
const get_milliseconds_from_1 = __importDefault(require("../functions/performance/get.milliseconds.from"));
require("json-circular-stringify");
const nodeRequire = (0, node_module_1.createRequire)(__filename);
const jsondiffpatch = nodeRequire('jsondiffpatch');
const DEFAULT_DELAY = 100;
const diffPatcher = jsondiffpatch.create({
    propertyFilter: (name) => name !== 'subscriptionId'
});
const _baseMessage = (target, incremental) => ({
    type: incremental ? 'increment' : 'update',
    target,
    payload: {}
});
class AStore extends rxjs_1.Subject {
    constructor(backend, target) {
        super();
        this._incremental = false;
        this._backend = backend;
        this._target = target;
        this._query = {};
        this._sort = {};
        this._fields = {};
        this._paging = {};
        this._populates = [];
        this._virtuals = [];
        this._delay = DEFAULT_DELAY;
        this._config = {
            query: { ___initial___: true },
            strict: false,
            incremental: false
        };
        this._subscriptionDiffs = new Map();
    }
    destroy() {
        var _a;
        (_a = this._subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        delete this._subscription;
    }
    restartSubscription() {
        this.subscription = this._backend
            .changes()
            .pipe((0, operators_1.throttleTime)(this._delay, rxjs_1.asyncScheduler, { leading: true, trailing: true }))
            .subscribe({
            next: (change) => {
                this.load(change)
                    .then(() => null)
                    .catch((e) => this.error(e));
            },
            error: (e) => this.error(e),
            complete: () => this.complete()
        });
    }
    isInitialSubscription(change) {
        return (0, lodash_1.isEmpty)(change);
    }
    extractFromConfig() {
        var _a;
        const cfg = this._config;
        let subscriptionIdResolved;
        if (cfg.subscriptionId === undefined)
            subscriptionIdResolved = (0, node_crypto_1.randomUUID)();
        else
            subscriptionIdResolved = cfg.subscriptionId;
        const queryResolved = cfg.query === undefined ? {} : cfg.query;
        const sortResolved = cfg.sort === undefined ? {} : cfg.sort;
        const fieldsResolved = cfg.fields === undefined ? {} : cfg.fields;
        const populatesResolved = cfg.populates === undefined ? [] : cfg.populates;
        const virtualsResolved = cfg.virtuals === undefined ? [] : cfg.virtuals;
        const delayResolved = (_a = cfg.delay) !== null && _a !== void 0 ? _a : DEFAULT_DELAY;
        this._subscriptionId = subscriptionIdResolved;
        this._query = queryResolved;
        this._sort = sortResolved;
        this._populates = populatesResolved;
        this._virtuals = virtualsResolved;
        this._delay = delayResolved;
        if ((0, lodash_1.isArray)(fieldsResolved)) {
            this._fields = {};
            (0, lodash_1.each)(fieldsResolved, (field) => (0, lodash_1.set)(this._fields, field, 1));
        }
        else {
            this._fields = fieldsResolved;
        }
    }
    testDocument(document) {
        try {
            const test = (0, sift_1.default)((0, lodash_1.omit)(this._query, ['createdAt', 'updatedAt']));
            return test(document);
        }
        catch (error) {
            console.error('[@owservable/core] -> AStore::testDocument Error:', { query: this._query, document, error });
            return true;
        }
    }
    set subscription(subscription) {
        this.destroy();
        this._subscription = subscription;
        this.load({}).then(() => null);
    }
    get backend() {
        return this._backend;
    }
    emitOne(startTime, subscriptionId, update = {}) {
        const message = _baseMessage(this._target, this._incremental);
        (0, lodash_1.set)(message.payload, this._target, update);
        this.next(Object.assign(Object.assign(Object.assign({ subscriptionId }, message), { execution_time: (0, get_milliseconds_from_1.default)(startTime).toFixed(2) + 'ms' }), this._responseStatistics()));
    }
    emitMany(startTime, subscriptionId, update) {
        let resolved;
        if (update === undefined) {
            resolved = {};
            resolved.total = 0;
            resolved.data = [];
            resolved.recounting = false;
        }
        else {
            resolved = update;
        }
        const { total, data, recounting } = resolved;
        const message = _baseMessage(this._target, this._incremental);
        (0, lodash_1.set)(message.payload, this._target, data);
        if (!this._incremental && total >= 0)
            (0, lodash_1.set)(message.payload, '_' + this._target + 'Count', total);
        if (recounting)
            (0, lodash_1.set)(message.payload, '_' + this._target + 'Recounting', true);
        this.next(Object.assign(Object.assign(Object.assign({ subscriptionId }, message), { execution_time: (0, get_milliseconds_from_1.default)(startTime).toFixed(2) + 'ms' }), this._responseStatistics()));
    }
    emitTotal(startTime, subscriptionId, total) {
        this.next(Object.assign({ subscriptionId, type: 'total', target: this._target, total, execution_time: (0, get_milliseconds_from_1.default)(startTime).toFixed(2) + 'ms' }, this._responseStatistics()));
    }
    emitDelete(startTime, subscriptionId, deleted) {
        this.next(Object.assign({ subscriptionId, type: 'delete', target: this._target, payload: deleted, execution_time: (0, get_milliseconds_from_1.default)(startTime).toFixed(2) + 'ms' }, this._responseStatistics()));
    }
    emitError(startTime, subscriptionId, error) {
        this.next(Object.assign({ subscriptionId, type: 'error', error, target: this._target, query: this._query, sort: this._sort, fields: this._fields, paging: this._paging, populates: this._populates, virtuals: this._virtuals, execution_time: (0, get_milliseconds_from_1.default)(startTime).toFixed(2) + 'ms' }, this._responseStatistics()));
    }
    shouldConsiderFields() {
        return !(0, lodash_1.isEmpty)(this._fields) && !(0, lodash_1.includes)((0, lodash_1.values)(this._fields), 0);
    }
    set config(config) {
        if (!this._isValidConfig(config))
            return;
        config.subscriptionId = config.subscriptionId || (0, node_crypto_1.randomUUID)();
        if (this._type === store_type_enum_1.default.COLLECTION) {
            const queryDiff = jsondiffpatch.diff((0, lodash_1.get)(this._config, 'query', {}), (0, lodash_1.get)(config, 'query', {}));
            this._addSubscriptionDiff(config.subscriptionId, !(0, lodash_1.isEmpty)(queryDiff));
        }
        this._config = (0, lodash_1.cloneDeep)(config);
        this.extractFromConfig();
        this.restartSubscription();
    }
    get target() {
        return this._target;
    }
    removeSubscriptionDiff(subId) {
        this._subscriptionDiffs.delete(subId);
    }
    isQueryChange(subId) {
        return !!this._subscriptionDiffs.get(subId);
    }
    _isValidConfig(config) {
        if (!config)
            return false;
        const diff = diffPatcher.diff(this._config, config);
        return !(0, lodash_1.isEmpty)(diff);
    }
    _addSubscriptionDiff(subId, diff) {
        this._subscriptionDiffs.set(subId, diff);
    }
    _responseStatistics() {
        try {
            return (0, lodash_1.omitBy)({
                query: JSON.stringify(this._query),
                sort: JSON.stringify(this._sort),
                fields: JSON.stringify(this._fields),
                paging: JSON.stringify(this._paging),
                populates: JSON.stringify(this._populates),
                virtuals: JSON.stringify(this._virtuals)
            }, lodash_1.isNil);
        }
        catch (error) {
            console.error('[@owservable/core] -> AStore::responseStatistics Error:', { error });
            return {};
        }
    }
}
exports.default = AStore;
//# sourceMappingURL=a.store.js.map