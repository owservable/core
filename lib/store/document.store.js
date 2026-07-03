'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const _ = __importStar(require("lodash"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const a_store_1 = __importDefault(require("./a.store"));
const store_type_enum_1 = __importDefault(require("../enums/store.type.enum"));
const get_hrtime_as_number_1 = __importDefault(require("../functions/performance/get.hrtime.as.number"));
const _getIdFromQuery = (query) => (_.isString(query) ? query : _.get(query, '_id', '').toString());
class DocumentStore extends a_store_1.default {
    constructor(backend, target) {
        super(backend, target);
        this._type = store_type_enum_1.default.DOCUMENT;
        Object.setPrototypeOf(this, DocumentStore.prototype);
    }
    extractFromConfig() {
        super.extractFromConfig();
        const { skip = 0 } = this._config;
        this._paging = skip ? {} : { skip, limit: 1 };
    }
    restartSubscription() {
        this.subscription = this._backend
            .changes()
            .pipe((0, operators_1.throttleTime)(this._delay, rxjs_1.asyncScheduler, { leading: true, trailing: true }))
            .pipe((0, operators_1.filter)((change) => this._pipeFilter(change)))
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
    shouldReload(change) {
        if (this.isInitialSubscription(change))
            return true;
        const id = _getIdFromQuery(this._query);
        const { operationType: type, documentKey, updateDescription: description } = change;
        const key = _.get(documentKey, '_id', '').toString();
        switch (type) {
            case 'delete':
                return true;
            case 'insert':
                return !id;
            case 'replace':
            case 'update': {
                if (id && id === key)
                    return true;
                if (!description)
                    return true;
                if (!this.shouldConsiderFields())
                    return true;
                const { updatedFields, removedFields } = description;
                const us = _.concat(removedFields, _.keys(updatedFields));
                const qs = _.keys(this._fields);
                return !_.isEmpty(_.intersection(qs, us));
            }
        }
        return false;
    }
    load(change) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = (0, get_hrtime_as_number_1.default)();
            if (_.isEmpty(this._config))
                return this.emitOne(startTime, this._subscriptionId);
            if (!this.shouldReload(change))
                return;
            const id = _getIdFromQuery(this._query);
            const { operationType: type, documentKey } = change;
            const key = _.get(documentKey, '_id', '').toString();
            if (type === 'delete' && id === key)
                return this.emitDelete(startTime, this._subscriptionId, key);
            try {
                let data;
                if (!_.isEmpty(this._sort))
                    data = yield this._loadSortedFirstDocument();
                else
                    data = id ? yield this._loadDocumentById(id) : yield this._loadDocument();
                if (!data)
                    return this.emitOne(startTime, this._subscriptionId);
                for (const populate of this._populates) {
                    yield this._backend.populate(data, populate);
                }
                if (_.isEmpty(this._virtuals))
                    return this.emitOne(startTime, this._subscriptionId, this._backend.toJSON(data));
                const jsonData = yield this._backend.resolveVirtuals(data, this._virtuals);
                this.emitOne(startTime, this._subscriptionId, jsonData);
            }
            catch (error) {
                console.error('[@owservable/core] -> DocumentStore::load Error:', { change, error });
                this.emitError(startTime, this._subscriptionId, error);
            }
        });
    }
    _pipeFilter(change) {
        if (!_.isEmpty(this._sort))
            return true;
        const { operationType: type } = change;
        if ('delete' === type)
            return true;
        const { documentKey, fullDocument: document } = change;
        const key = _.get(documentKey, '_id', '').toString();
        if (key === _getIdFromQuery(this._query))
            return true;
        return this.testDocument(document);
    }
    _loadDocumentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._backend.findById(id, this._fields, []);
        });
    }
    _loadSortedFirstDocument() {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield this._backend.find(this._query, this._fields, this._paging, this._sort, []);
            return _.first(docs);
        });
    }
    _loadDocument() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._backend.findOne(this._query, this._fields, []);
        });
    }
}
exports.default = DocumentStore;
//# sourceMappingURL=document.store.js.map