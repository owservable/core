'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const folders_1 = require("@owservable/folders");
const execute_on_files_recursively_1 = __importDefault(require("./execute.on.files.recursively"));
const executeProcessesInFolder = (root, folderName, execute) => {
    const folders = (0, folders_1.listSubfoldersByName)(root, folderName);
    folders.forEach((folder) => (0, execute_on_files_recursively_1.default)(folder, execute));
};
exports.default = executeProcessesInFolder;
//# sourceMappingURL=execute.processes.in.folder.js.map