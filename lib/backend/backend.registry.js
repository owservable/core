'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class BackendRegistry {
    static register(observe, backend) {
        if (BackendRegistry._backends.has(observe)) {
            console.warn(`[@owservable/core] -> BackendRegistry: overwriting backend registration for "${observe}"`);
        }
        BackendRegistry._backends.set(observe, backend);
    }
    static get(observe) {
        var _a;
        return (_a = BackendRegistry._backends.get(observe)) !== null && _a !== void 0 ? _a : null;
    }
    static has(observe) {
        return BackendRegistry._backends.has(observe);
    }
    static keys() {
        return Array.from(BackendRegistry._backends.keys());
    }
    static clear() {
        BackendRegistry._backends.clear();
    }
    constructor() { }
}
BackendRegistry._backends = new Map();
exports.default = BackendRegistry;
//# sourceMappingURL=backend.registry.js.map