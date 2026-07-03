'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execute_worker_1 = __importDefault(require("./execute/execute.worker"));
const execute_processes_in_folder_1 = __importDefault(require("./execute/execute.processes.in.folder"));
const initiateWorkers = (root, folder = 'workers') => {
    (0, execute_processes_in_folder_1.default)(root, folder, execute_worker_1.default);
};
exports.default = initiateWorkers;
//# sourceMappingURL=initiate.workers.js.map