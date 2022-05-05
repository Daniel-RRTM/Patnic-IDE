"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpicAnchorIntelliSenseProvider = exports.EpicAnchorProvider = void 0;
const vscode_1 = require("vscode");
const entryAnchor_1 = require("../anchor/entryAnchor");
const anchorEngine_1 = require("../anchorEngine");
const entryEpic_1 = require("../anchor/entryEpic");
const flattener_1 = require("../util/flattener");
/**
 * AnchorProvider implementation in charge of returning the anchors in the current workspace
 */
class EpicAnchorProvider {
    constructor(provider) {
        this.onDidChangeTreeData = provider._onDidChangeTreeData.event;
        this.provider = provider;
    }
    generateLabel(i, e) {
        return e.label;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return new Promise((success) => {
            // The default is empty, so you have to build a tree
            if (element) {
                if (element instanceof entryAnchor_1.default && element.children) {
                    success(element.children.map((v, i) => {
                        v.label = this.generateLabel(i, v);
                        return v;
                    }));
                    return;
                }
                else if (element instanceof entryEpic_1.default) {
                    // it is EntryEpic
                    // let res: EntryAnchor[] = [];
                    // const cachedFile = (element as EntryCachedFile);
                    // if (this.provider._config!.tags.displayHierarchyInWorkspace) {
                    //     cachedFile.anchors.forEach((anchor: EntryAnchor) => {
                    //         if (!anchor.isVisibleInWorkspace) return;
                    //         res.push(anchor.copy(true));
                    //     });
                    // } else {
                    //     EpicAnchorProvider.flattenAnchors(cachedFile.anchors).forEach((anchor: EntryAnchor) => {
                    //         if (!anchor.isVisibleInWorkspace) return;
                    //         res.push(anchor.copy(false));
                    //     });
                    // }
                    // success(EntryAnchor.sortAnchors(res));
                    const res = [];
                    const epic = element;
                    anchorEngine_1.AnchorEngine.output(`this.provider._config!.tags.displayHierarchyInWorkspace: ${this.provider._config.tags.displayHierarchyInWorkspace}`);
                    if (this.provider._config.tags.displayHierarchyInWorkspace) {
                        epic.anchors.forEach((anchor) => {
                            if (!anchor.isVisibleInWorkspace)
                                return;
                            res.push(anchor.copy(true, false));
                        });
                    }
                    else {
                        flattener_1.flattenAnchors(epic.anchors).forEach((anchor) => {
                            if (!anchor.isVisibleInWorkspace)
                                return;
                            res.push(anchor.copy(false, false));
                        });
                    }
                    const anchors = res
                        .sort((left, right) => {
                        return left.attributes.seq - right.attributes.seq;
                    })
                        .map((v, i) => {
                        v.label = this.generateLabel(i, v);
                        return v;
                    });
                    success(anchors);
                }
                else {
                    anchorEngine_1.AnchorEngine.output("return empty array");
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
            const res = [];
            const epicMaps = new Map();
            // Build the epic entries
            Array.from(this.provider.anchorMaps).forEach(([, anchorIndex], _) => {
                anchorIndex.anchorTree.forEach((anchor) => {
                    const epic = anchor.attributes.epic;
                    if (!epic)
                        return;
                    const anchorEpic = epicMaps.get(epic);
                    if (anchorEpic) {
                        anchorEpic.push(anchor);
                    }
                    else {
                        epicMaps.set(epic, [anchor]);
                    }
                });
            });
            // Sort and build the entry list
            epicMaps.forEach((anchorArr, epic) => {
                anchorArr.sort((left, right) => {
                    return left.attributes.seq - left.attributes.seq;
                });
                res.push(new entryEpic_1.default(epic, `${epic}`, anchorArr, this.provider));
            });
            if (res.length == 0) {
                success([this.provider.errorEmptyEpics]);
                return;
            }
            success(res);
        });
    }
}
exports.EpicAnchorProvider = EpicAnchorProvider;
class EpicAnchorIntelliSenseProvider {
    constructor(engine) {
        this.engine = engine;
    }
    provideCompletionItems(_document, _position, _token, _context) {
        const config = this.engine._config;
        anchorEngine_1.AnchorEngine.output("provideCompletionItems");
        const keyWord = _document.getText(_document.getWordRangeAtPosition(_position.translate(0, -1)));
        const hasKeyWord = Array.from(this.engine.tags.keys()).find((v) => v.toUpperCase() === keyWord);
        if (hasKeyWord) {
            const epicCtr = new Map();
            this.engine.anchorMaps.forEach((anchorIndex, uri) => {
                anchorIndex.anchorTree.forEach((entryAnchor) => {
                    const { seq, epic } = entryAnchor.attributes;
                    if (epic) {
                        epicCtr.set(epic, Math.max(epicCtr.get(epic) || 0, seq));
                    }
                });
            });
            return Array.from(epicCtr).map(([epic, maxSeq]) => new vscode_1.CompletionItem(`epic=${epic},seq=${maxSeq + config.epic.seqStep}`, vscode_1.CompletionItemKind.Enum));
        }
        return [];
    }
}
exports.EpicAnchorIntelliSenseProvider = EpicAnchorIntelliSenseProvider;
//# sourceMappingURL=epicAnchorProvider.js.map