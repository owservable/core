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
const a_store_1 = __importDefault(require("./a.store"));
const store_type_enum_1 = __importDefault(require("../enums/store.type.enum"));
const get_hrtime_as_number_1 = __importDefault(require("../functions/performance/get.hrtime.as.number"));
class CountStore extends a_store_1.default {
    constructor(backend, target) {
        super(backend, target);
        this._type = store_type_enum_1.default.COUNT;
        Object.setPrototypeOf(this, CountStore.prototype);
    }
    shouldReload(change) {
        if (this.isInitialSubscription(change))
            return true;
        const { operationType: type } = change;
        switch (type) {
            case 'delete':
            case 'insert':
                return true;
            case 'replace':
            case 'update':
            default:
                return false;
        }
    }
    load(change) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = (0, get_hrtime_as_number_1.default)();
            if (Object.keys(this._config).length === 0)
                return this.emitOne(startTime, this._subscriptionId);
            if (!this.shouldReload(change))
                return;
            const count = yield this._backend.count(this._query);
            this.emitOne(startTime, this._subscriptionId, count);
        });
    }
}
exports.default = CountStore;
//# sourceMappingURL=count.store.js.map