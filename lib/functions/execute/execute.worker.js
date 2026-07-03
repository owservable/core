'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const executeWorker = (obj) => {
    const { init, work } = obj;
    if (typeof init === 'function')
        init().then(() => work === null || work === void 0 ? void 0 : work());
    else
        work === null || work === void 0 ? void 0 : work();
};
exports.default = executeWorker;
//# sourceMappingURL=execute.worker.js.map