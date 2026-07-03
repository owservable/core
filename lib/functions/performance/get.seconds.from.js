'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NS_PER_SEC = void 0;
const get_hrtime_as_number_1 = __importDefault(require("./get.hrtime.as.number"));
exports.NS_PER_SEC = 1e9;
const getSecondsFrom = (start) => Number((0, get_hrtime_as_number_1.default)() - start) / exports.NS_PER_SEC;
exports.default = getSecondsFrom;
//# sourceMappingURL=get.seconds.from.js.map