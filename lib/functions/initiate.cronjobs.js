'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execute_cronjob_1 = __importDefault(require("./execute/execute.cronjob"));
const execute_processes_in_folder_1 = __importDefault(require("./execute/execute.processes.in.folder"));
const initiateCronjobs = (root, folder = 'cronjobs') => {
    (0, execute_processes_in_folder_1.default)(root, folder, execute_cronjob_1.default);
};
exports.default = initiateCronjobs;
//# sourceMappingURL=initiate.cronjobs.js.map