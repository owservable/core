'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const executeWatcher = (obj) => {
    const { init, watch, waitForInit = false } = obj;
    if (true !== waitForInit) {
        if (typeof init === 'function')
            init().then(() => null);
        watch === null || watch === void 0 ? void 0 : watch();
        return;
    }
    if (typeof init === 'function')
        init().then(() => watch === null || watch === void 0 ? void 0 : watch());
    else
        watch === null || watch === void 0 ? void 0 : watch();
};
exports.default = executeWatcher;
//# sourceMappingURL=execute.watcher.js.map