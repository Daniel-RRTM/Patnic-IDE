"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const entryBase_1 = require("./entryBase");
/**
 * Represents an Anchor found a Epic
 */
class EntryEpic extends entryBase_1.default {
    constructor(epic, label, anchors, engine) {
        super(engine, label, vscode_1.TreeItemCollapsibleState.Expanded);
        this.contextValue = "epic";
        this.epic = epic;
        this.anchors = anchors;
        this.tooltip = `${this.epic}`;
        // this.iconPath = {
        //     light: path.join(__dirname, '..', 'res', `book.svg`),
        //     dark: path.join(__dirname, '..', 'res', `book.svg`)
        // };
    }
    toString() {
        return this.label;
    }
}
exports.default = EntryEpic;
//# sourceMappingURL=entryEpic.js.map