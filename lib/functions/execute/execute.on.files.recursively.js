'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const executeOnFilesRecursively = (folder, execute) => {
    const children = fs.readdirSync(folder);
    const itemStats = children.map((name) => {
        const fullPath = path.join(folder, name);
        const stat = fs.lstatSync(fullPath);
        return {
            name,
            fullPath,
            isDirectory: stat.isDirectory()
        };
    });
    const files = itemStats.filter((item) => !item.isDirectory);
    const folders = itemStats.filter((item) => item.isDirectory);
    files.forEach((file) => {
        const obj = require(file.fullPath).default;
        execute(obj);
    });
    folders.forEach((subFolder) => executeOnFilesRecursively(subFolder.fullPath, execute));
};
exports.default = executeOnFilesRecursively;
//# sourceMappingURL=execute.on.files.recursively.js.map