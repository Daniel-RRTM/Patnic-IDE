"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceAnchorProvider = void 0;
const vscode_1 = require("vscode");
const entryAnchor_1 = require("../anchor/entryAnchor");
const entryCachedFile_1 = require("../anchor/entryCachedFile");
const flattener_1 = require("../util/flattener");
/**
 * AnchorProvider implementation in charge of returning the anchors in the current workspace
 */
class WorkspaceAnchorProvider {
    constructor(provider) {
        this.onDidChangeTreeData = provider._onDidChangeTreeData.event;
        this.provider = provider;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return new Promise((success) => {
            if (element) {
                if (element instanceof entryAnchor_1.default && element.children) {
                    success(element.children);
                    return;
                }
                else if (element instanceof entryCachedFile_1.default) {
                    const res = [];
                    const cachedFile = element;
                    if (this.provider._config.tags.displayHierarchyInWorkspace) {
                        cachedFile.anchors.forEach((anchor) => {
                            if (!anchor.isVisibleInWorkspace)
                                return;
                            res.push(anchor.copy(true));
                        });
                    }
                    else {
                        flattener_1.flattenAnchors(cachedFile.anchors).forEach((anchor) => {
                            if (!anchor.isVisibleInWorkspace)
                                return;
                            res.push(anchor.copy(false));
                        });
                    }
                    success(entryAnchor_1.default.sortAnchors(res));
                }
                else {
                    success([]);
                }
                return;
            }
            if (!this.provider._config.workspace.enabled) {
                success([this.provider.errorWorkspaceDisabled]);
                return;
            }
            else if (!vscode_1.workspace.workspaceFolders) {
                success([this.provider.errorFileOnly]);
                return;
            }
            else if (this.provider._config.workspace.lazyLoad && !this.provider.anchorsScanned) {
                success([this.provider.statusScan]);
            }
            else if (!this.provider.anchorsLoaded) {
                success([this.provider.statusLoading]);
                return;
            }
            const format = this.provider._config.workspace.pathFormat;
            const res = [];
            this.provider.anchorMaps.forEach((index, document) => {
                const anchors = index.anchorTree;
                if (anchors.length == 0)
                    return; // Skip empty files
                let notVisible = true;
                anchors.forEach((anchor) => {
                    if (anchor.isVisibleInWorkspace)
                        notVisible = false;
                });
                if (!notVisible) {
                    try {
                        res.push(new entryCachedFile_1.default(this.provider, document, anchors, format));
                    }
                    catch (err) {
                        // Simply ignore, we do not want to push this file
                    }
                }
            });
            if (res.length == 0) {
                success([this.provider.errorEmptyWorkspace]);
                return;
            }
            success(res.sort((left, right) => {
                return left.label.localeCompare(right.label);
            }));
        });
    }
}
exports.WorkspaceAnchorProvider = WorkspaceAnchorProvider;
//# sourceMappingURL=workspaceAnchorProvider.js.map