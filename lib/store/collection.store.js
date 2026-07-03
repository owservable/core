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
const a_store_1 = __importDefault(require("./a.store"));
const store_type_enum_1 = __importDefault(require("../enums/store.type.enum"));
const get_hrtime_as_number_1 = __importDefault(require("../functions/performance/get.hrtime.as.number"));
class CollectionStore extends a_store_1.default {
    constructor(backend, target) {
        super(backend, target);
        this.delaySendCount = _.throttle(this.sendCount, 5000);
        this._totalCount = -1;
        this._type = store_type_enum_1.default.COLLECTION;
        Object.setPrototypeOf(this, CollectionStore.prototype);
    }
    shouldReload(change) {
        if (this.isInitialSubscription(change))
            return true;
        const { operationType, updateDescription, fullDocument } = change;
        if (!updateDescription)
            return true;
        const { updatedFields, removedFields } = updateDescription;
        const us = _.concat(removedFields, _.keys(updatedFields));
        if (!_.isEmpty(_.intersection(_.keys(this._query), us)))
            return true;
        switch (operationType) {
            case 'delete':
            case 'insert':
                return true;
            case 'replace':
            case 'update':
                if (this.shouldConsiderFields())
                    return !_.isEmpty(_.intersection(_.keys(this._fields), us));
                return this.testDocument(fullDocument);
        }
        return false;
    }
    sendCount(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = (0, get_hrtime_as_number_1.default)();
            this._totalCount = yield this._backend.count(this._query);
            this.emitTotal(startTime, subscriptionId, this._totalCount);
        });
    }
    loadIncremental(startTime, currentLoadSubscriptionId, change) {
        return __awaiter(this, void 0, void 0, function* () {
            const { operationType, documentKey, fullDocument } = change;
            const key = _.get(documentKey, '_id', '').toString();
            if ('delete' === operationType)
                return this.emitDelete(startTime, currentLoadSubscriptionId, key);
            for (const populate of this._populates) {
                yield this._backend.populate(fullDocument, populate);
            }
            let document = fullDocument;
            if (!_.isEmpty(this._virtuals)) {
                document = yield this._backend.resolveVirtuals(fullDocument, this._virtuals);
            }
            return this.emitMany(startTime, currentLoadSubscriptionId, { data: document });
        });
    }
    loadAll(startTime, currentLoadSubscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            let documents = yield this._backend.find(this._query, this._fields, this._paging, this._sort, this._populates);
            if (!_.isEmpty(this._virtuals)) {
                const replacements = [];
                for (const document of documents) {
                    replacements.push(yield this._backend.resolveVirtuals(document, this._virtuals));
                }
                documents = replacements;
            }
            if (this.isQueryChange(currentLoadSubscriptionId)) {
                this.emitMany(startTime, currentLoadSubscriptionId, { total: this._totalCount, data: documents, recounting: true });
                yield this.sendCount(currentLoadSubscriptionId);
            }
            else {
                this.emitMany(startTime, currentLoadSubscriptionId, { total: this._totalCount, data: documents });
                this.delaySendCount(currentLoadSubscriptionId);
            }
            this.removeSubscriptionDiff(currentLoadSubscriptionId);
        });
    }
    load(change) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = (0, get_hrtime_as_number_1.default)();
            const currentLoadSubscriptionId = this._subscriptionId + '';
            if (_.isEmpty(this._config))
                return this.emitMany(startTime, currentLoadSubscriptionId);
            if (!this.shouldReload(change))
                return;
            try {
                const { fullDocument } = change;
                if (fullDocument && this._incremental) {
                    yield this.loadIncremental(startTime, currentLoadSubscriptionId, change);
                }
                else {
                    yield this.loadAll(startTime, currentLoadSubscriptionId);
                }
            }
            catch (error) {
                console.error('[@owservable/core] -> CollectionStore::load Error:', { change, error });
                this.emitError(startTime, currentLoadSubscriptionId, error);
            }
        });
    }
    extractFromConfig() {
        super.extractFromConfig();
        const { incremental = false, page = 1, pageSize } = this._config;
        this._incremental = incremental;
        this._paging = {};
        if (pageSize) {
            this._paging = {
                skip: (page - 1) * pageSize,
                limit: pageSize
            };
        }
    }
}
exports.default = CollectionStore;
//# sourceMappingURL=collection.store.js.map