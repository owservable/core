'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addActionWorkers;
const folders_1 = require("@owservable/folders");
const execute_worker_1 = __importDefault(require("../execute/execute.worker"));
function addActionWorkers(root, folderName) {
    const actionPaths = (0, folders_1.listSubfoldersFilesByFolderName)(root, folderName);
    for (const actionPath of actionPaths) {
        console.log('[@owservable] -> Initializing worker action', actionPath);
        const ActionClass = require(actionPath).default;
        const action = new ActionClass();
        if (typeof action.asWorker === 'function') {
            const job = Object.assign(Object.assign({}, (action.asWorkerInit && { init: action.asWorkerInit })), { work: action.asWorker });
            if (typeof action.asWorkerInit === 'function')
                job.init = action.asWorkerInit;
            (0, execute_worker_1.default)(job);
        }
    }
}
//# sourceMappingURL=add.action.workers.js.map