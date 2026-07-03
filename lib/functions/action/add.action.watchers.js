'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addActionWatchers;
const folders_1 = require("@owservable/folders");
const execute_watcher_1 = __importDefault(require("../execute/execute.watcher"));
function addActionWatchers(root, folderName) {
    const actionPaths = (0, folders_1.listSubfoldersFilesByFolderName)(root, folderName);
    for (const actionPath of actionPaths) {
        console.log('[@owservable] -> Initializing watcher action', actionPath);
        const ActionClass = require(actionPath).default;
        const action = new ActionClass();
        if (typeof action.asWatcher === 'function') {
            const job = Object.assign(Object.assign({}, (action.asWatcherInit && { init: action.asWatcherInit })), { watch: action.asWatcher });
            if (typeof action.asWatcherInit === 'function')
                job.init = action.asWatcherInit;
            (0, execute_watcher_1.default)(job);
        }
    }
}
//# sourceMappingURL=add.action.watchers.js.map