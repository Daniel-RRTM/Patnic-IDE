"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncDelay = void 0;
/**
 * Utility used for awaiting a timeout
 *
 * @param delay Delay in ms
 */
function asyncDelay(delay) {
    return new Promise((success) => {
        setTimeout(() => {
            success();
        }, delay);
    });
}
exports.asyncDelay = asyncDelay;
//# sourceMappingURL=asyncDelay.js.map