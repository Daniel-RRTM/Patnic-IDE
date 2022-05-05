"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenAnchors = void 0;
/**
 * Flattens hierarchical anchors into a single array
 *
 * @param anchors Array to flatten
 */
function flattenAnchors(anchors) {
    const list = [];
    function crawlList(anchors) {
        anchors.forEach((anchor) => {
            list.push(anchor);
            crawlList(anchor.children);
        });
    }
    crawlList(anchors);
    return list;
}
exports.flattenAnchors = flattenAnchors;
//# sourceMappingURL=flattener.js.map