'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addActionCronjobs;
const folders_1 = require("@owservable/folders");
const execute_cronjob_1 = __importDefault(require("../execute/execute.cronjob"));
function addActionCronjobs(root, folderName) {
    const actionPaths = (0, folders_1.listSubfoldersFilesByFolderName)(root, folderName);
    for (const actionPath of actionPaths) {
        console.log('[@owservable] -> Initializing cronjob action', actionPath);
        const ActionClass = require(actionPath).default;
        const action = new ActionClass();
        if (typeof action.asCronjob === 'function') {
            const job = Object.assign(Object.assign({ schedule: action.schedule() }, (action.asCronjobInit && { init: action.asCronjobInit })), { job: action.asCronjob });
            if (typeof action.asCronjobInit === 'function')
                job.init = action.asCronjobInit;
            (0, execute_cronjob_1.default)(job);
        }
    }
}
//# sourceMappingURL=add.action.cronjobs.js.map