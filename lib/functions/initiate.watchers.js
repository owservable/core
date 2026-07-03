'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execute_watcher_1 = __importDefault(require("./execute/execute.watcher"));
const execute_processes_in_folder_1 = __importDefault(require("./execute/execute.processes.in.folder"));
const initiateWatchers = (root, folder = 'watchers') => {
    (0, execute_processes_in_folder_1.default)(root, folder, execute_watcher_1.default);
};
exports.default = initiateWatchers;
//# sourceMappingURL=initiate.watchers.js.map