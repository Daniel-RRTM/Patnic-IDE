"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const entryBase_1 = require("./entryBase");
const path = require("path");
/**
 * Represents a workspace file holding one or more anchors
 */
class EntryCachedFile extends entryBase_1.default {
    constructor(engine, file, anchors, format) {
        super(engine, EntryCachedFile.fileAnchorStats(file, anchors, format), vscode_1.TreeItemCollapsibleState.Expanded);
        this.file = file;
        this.anchors = anchors;
        this.format = format;
        this.tooltip = `${this.file.path}`;
        this.contextValue = "cachedFile";
        this.iconPath = vscode_1.ThemeIcon.File;
    }
    toString() {
        return this.label;
    }
    /**
     * Formats a file stats string using the given anchors array
     */
    static fileAnchorStats(file, anchors, format) {
        let visible = 0;
        let hidden = 0;
        anchors.forEach((anchor) => {
            if (anchor.isVisibleInWorkspace) {
                visible++;
            }
            else {
                hidden++;
            }
        });
        let ret = visible + " Anchors";
        if (hidden > 0) {
            ret += ", " + hidden + " Hidden";
        }
        let title = " (" + ret + ")";
        let titlePath;
        const root = vscode_1.workspace.getWorkspaceFolder(file) || vscode_1.workspace.workspaceFolders[0];
        if (root) {
            titlePath = path.relative(root.uri.path, file.path);
        }
        else {
            titlePath = file.path;
        }
        // Verify relativity
        if (titlePath.startsWith("..")) {
            throw new Error("Cannot crate cached file for external documents");
        }
        // Always use unix style separators
        titlePath = titlePath.replace(/\\/g, "/");
        // Tweak the path format based on settings
        if (format == "hidden") {
            title = titlePath.substr(titlePath.lastIndexOf("/") + 1);
        }
        else if (format == "abbreviated") {
            const segments = titlePath.split("/");
            const abbrPath = segments
                .map((segment, i) => {
                if (i < segments.length - 1 && i > 0) {
                    return segment[0];
                }
                else {
                    return segment;
                }
            })
                .join("/");
            title = abbrPath + title;
        }
        else {
            title = titlePath + title;
        }
        if (vscode_1.workspace.workspaceFolders.length > 1) {
            let ws = root.name;
            if (ws.length > 12) {
                ws = ws.substr(0, 12) + "…";
            }
            title = ws + " → " + title;
        }
        return title;
    }
}
exports.default = EntryCachedFile;
//# sourceMappingURL=entryCachedFile.js.map