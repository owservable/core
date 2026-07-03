'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const count_store_1 = __importDefault(require("../count.store"));
const document_store_1 = __importDefault(require("../document.store"));
const collection_store_1 = __importDefault(require("../collection.store"));
const backend_registry_1 = __importDefault(require("../../backend/backend.registry"));
const storeFactory = (scope, observe, target) => {
    const backend = backend_registry_1.default.get(observe);
    if (scope === 'many')
        return new collection_store_1.default(backend, target);
    if (scope === 'count')
        return new count_store_1.default(backend, target);
    return new document_store_1.default(backend, target);
};
exports.default = storeFactory;
//# sourceMappingURL=store.factory.js.map