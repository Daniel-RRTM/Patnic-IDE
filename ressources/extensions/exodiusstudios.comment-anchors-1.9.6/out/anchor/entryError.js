"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const entryBase_1 = require("./entryBase");
/**
 * Represents a caught error
 */
class EntryError extends entryBase_1.default {
    constructor(engine, message) {
        super(engine, message, vscode_1.TreeItemCollapsibleState.None);
        this.contextValue = "error";
        this.message = message;
        this.tooltip = this.message;
        this.iconPath = {
            light: this.loadResourceSvg("cross"),
            dark: this.loadResourceSvg("cross"),
        };
    }
    toString() {
        return "EntryError{}";
    }
}
exports.default = EntryError;
//# sourceMappingURL=entryError.js.map