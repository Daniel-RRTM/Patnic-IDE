"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAnchorProvider = void 0;
const entryAnchor_1 = require("../anchor/entryAnchor");
const entryCursor_1 = require("../anchor/entryCursor");
const vscode_1 = require("vscode");
/**
 * AnchorProvider implementation in charge of returning the anchors in the current file
 */
class FileAnchorProvider {
    constructor(provider) {
        this.renderCursor = true;
        this.cursorFound = false;
        this.onDidChangeTreeData = provider._onDidChangeTreeData.event;
        this.provider = provider;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            if (element instanceof entryAnchor_1.default && element.children) {
                let children = element.children.filter((child) => !child.isHidden);
                if (this.renderCursor) {
                    children = this.insertCursor(children);
                }
                return Promise.resolve(children); // Insert
            }
            return Promise.resolve([]);
        }
        this.cursorFound = false;
        const fileAnchors = this.provider.currentAnchors.filter((child) => !child.isHidden);
        // Return result
        return new Promise((resolve) => {
            if (!this.provider.anchorsLoaded) {
                resolve([this.provider.statusLoading]);
            }
            else if (this.provider._editor == undefined) {
                resolve([this.provider.errorUnusableItem]);
            }
            else if (fileAnchors.length == 0) {
                resolve([this.provider.errorEmptyItem]);
            }
            else {
                let anchors = entryAnchor_1.default.sortAnchors(fileAnchors);
                if (this.renderCursor) {
                    anchors = this.insertCursor(anchors);
                }
                resolve(anchors); // Insert
            }
        });
    }
    insertCursor(anchors) {
        var _a, _b, _c;
        const cursor = (_c = (_b = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.selection) === null || _b === void 0 ? void 0 : _b.active) === null || _c === void 0 ? void 0 : _c.line;
        if (!this.provider._config.showCursor || cursor === undefined) {
            return anchors;
        }
        const ret = [];
        for (const anchor of anchors) {
            if (!this.cursorFound && anchor instanceof entryAnchor_1.default && anchor.lineNumber > cursor) {
                ret.push(new entryCursor_1.default(this.provider, cursor + 1));
                this.cursorFound = true;
            }
            ret.push(anchor);
        }
        return ret;
    }
}
exports.FileAnchorProvider = FileAnchorProvider;
//# sourceMappingURL=fileAnchorProvider.js.map