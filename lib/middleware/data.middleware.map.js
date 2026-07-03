'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class DataMiddlewareMap {
    static addMiddleware(collection, processor) {
        DataMiddlewareMap._middlewares.set(`${collection}`, processor);
    }
    static hasMiddleware(collection) {
        return !!DataMiddlewareMap._middlewares.get(`${collection}`);
    }
    static getMiddleware(collection) {
        return DataMiddlewareMap._middlewares.get(`${collection}`);
    }
    static keys() {
        return Array.from(DataMiddlewareMap._middlewares.keys());
    }
}
DataMiddlewareMap._middlewares = new Map();
exports.default = DataMiddlewareMap;
//# sourceMappingURL=data.middleware.map.js.map