"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entryBase_1 = require("./entryBase");
const vscode_1 = require("vscode");
/**
 * Represents the current cursor
 */
class EntryCursor extends entryBase_1.default {
    constructor(engine, line) {
        super(engine, `➤ Cursor position (line ${line})`, vscode_1.TreeItemCollapsibleState.None);
        this.contextValue = "cursor";
        this.tooltip = this.label;
        this.iconPath = {
            light: this.loadResourceSvg("cursor"),
            dark: this.loadResourceSvg("cursor"),
        };
    }
    toString() {
        return "EntryCursor{}";
    }
}
exports.default = EntryCursor;
//# sourceMappingURL=entryCursor.js.map