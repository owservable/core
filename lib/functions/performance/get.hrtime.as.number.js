'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const node_process_1 = require("node:process");
const getHrtimeAsNumber = () => Number(node_process_1.hrtime.bigint());
exports.default = getHrtimeAsNumber;
//# sourceMappingURL=get.hrtime.as.number.js.map