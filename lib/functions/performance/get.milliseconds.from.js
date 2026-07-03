'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_seconds_from_1 = __importDefault(require("./get.seconds.from"));
const getMillisecondsFrom = (start) => (0, get_seconds_from_1.default)(start) * 1000;
exports.default = getMillisecondsFrom;
//# sourceMappingURL=get.milliseconds.from.js.map