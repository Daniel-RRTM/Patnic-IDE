"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const entryBase_1 = require("./entryBase");
/**
 * Represents a pending workspace scan
 */
class EntryScan extends entryBase_1.default {
    constructor(engine) {
        super(engine, "Click to start scanning", vscode_1.TreeItemCollapsibleState.None);
        this.tooltip = this.label;
        this.contextValue = "launch";
        this.iconPath = {
            light: this.loadResourceSvg("launch"),
            dark: this.loadResourceSvg("launch"),
        };
        this.command = {
            title: "Initiate scan",
            command: "commentAnchors.launchWorkspaceScan",
        };
    }
    toString() {
        return "EntryLaunch{}";
    }
}
exports.default = EntryScan;
//# sourceMappingURL=entryScan.js.map