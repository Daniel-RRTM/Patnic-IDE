"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
/**
 * Base class extended by all implementions of a TreeItem
 * which represent an entity in the anchor panel.
 */
class EntryBase extends vscode_1.TreeItem {
    constructor(engine, label, state) {
        super(label, state);
        this.engine = engine;
    }
    /**
     * Load an svg of the given name from the resource directory
     *
     * @param name Icon name
     * @returns The path
     */
    loadResourceSvg(name) {
        return path.join(__dirname, "../../res", name + ".svg");
    }
    /**
     * Load an svg of the given color from the resource directory.
     * The icon must be generated first.
     *
     * @param name Icon color
     * @returns The path
     */
    loadCacheSvg(color) {
        return path.join(this.engine.iconCache, "anchor_" + color + ".svg");
    }
}
exports.default = EntryBase;
//# sourceMappingURL=entryBase.js.map