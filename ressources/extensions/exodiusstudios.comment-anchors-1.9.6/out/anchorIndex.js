"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnchorIndex = void 0;
/**
 * An index of all anchors found within a file
 */
class AnchorIndex {
    constructor(anchorTree) {
        /** Collection of anchors indexed by their content text*/
        this.textIndex = new Map();
        this.anchorTree = anchorTree;
        this.indexAnchors(anchorTree);
    }
    /**
     * Index the given anchor array
     *
     * @param list The anchor list
     */
    indexAnchors(list) {
        for (const anchor of list) {
            this.textIndex.set(anchor.anchorText, anchor);
            if (anchor.children.length) {
                this.indexAnchors(anchor.children);
            }
        }
    }
}
exports.AnchorIndex = AnchorIndex;
/** Constant empty index */
AnchorIndex.EMPTY = new AnchorIndex([]);
//# sourceMappingURL=anchorIndex.js.map