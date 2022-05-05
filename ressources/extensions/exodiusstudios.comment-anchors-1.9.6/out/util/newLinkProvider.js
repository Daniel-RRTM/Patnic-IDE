"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkProvider = void 0;
const vscode_1 = require("vscode");
const path_1 = require("path");
const anchorEngine_1 = require("../anchorEngine");
const flattener_1 = require("./flattener");
const fs_1 = require("fs");
const LINK_REGEX = /^(\.{1,2}[/\\])?(.+?)(:\d+|#[\w-]+)?$/;
class LinkProvider {
    constructor(engine) {
        this.engine = engine;
    }
    provideDocumentLinks(document, token) {
        var _a, _b, _c;
        if (document.uri.scheme == "output") {
            return [];
        }
        const index = this.engine.anchorMaps.get(document.uri);
        const list = [];
        if (!index) {
            return [];
        }
        const flattened = flattener_1.flattenAnchors(index.anchorTree);
        const basePath = path_1.join(document.uri.fsPath, "..");
        const workspacePath = (_c = (_b = (_a = vscode_1.workspace.getWorkspaceFolder(document.uri)) === null || _a === void 0 ? void 0 : _a.uri) === null || _b === void 0 ? void 0 : _b.fsPath) !== null && _c !== void 0 ? _c : "";
        flattened
            .filter((anchor) => {
            const tagId = anchor.anchorTag;
            const tag = this.engine.tags.get(tagId);
            return (tag === null || tag === void 0 ? void 0 : tag.behavior) == "link";
        })
            .forEach((anchor) => {
            var _a, _b, _c;
            const components = LINK_REGEX.exec(anchor.anchorText);
            const parameter = components[3] || "";
            const filePath = components[2];
            const relativeFolder = components[1];
            const fullPath = relativeFolder ? path_1.resolve(basePath, relativeFolder, filePath) : path_1.resolve(workspacePath, filePath);
            const fileUri = vscode_1.Uri.file(fullPath);
            const exists = fs_1.lstatSync(fullPath).isFile();
            if (exists) {
                const anchorRange = anchor.getAnchorRange(document, true);
                let docLink;
                if (parameter.startsWith(":")) {
                    const lineNumber = parseInt(parameter.substr(1)) - 1;
                    const newUri = fileUri.with({
                        path: `${fileUri.path}#${lineNumber}`,
                    });
                    anchorEngine_1.AnchorEngine.output("STRONT = " + newUri.toString());
                    docLink = new vscode_1.DocumentLink(anchorRange, newUri);
                    docLink.tooltip = "Click here to open file at line " + (lineNumber + 1);
                }
                else {
                    if (parameter.startsWith("#")) {
                        const targetId = parameter.substr(1);
                        this.engine.revealAnchorOnParse = targetId;
                        if (fileUri.path == ((_c = (_b = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.uri) === null || _c === void 0 ? void 0 : _c.path)) {
                            docLink = new vscode_1.DocumentLink(anchorRange, fileUri);
                            docLink.tooltip = "Click here to go to anchor " + targetId;
                        }
                        else {
                            docLink = new vscode_1.DocumentLink(anchorRange, fileUri);
                            docLink.tooltip = "Click here to open file at anchor " + targetId;
                        }
                    }
                    else {
                        docLink = new vscode_1.DocumentLink(anchorRange, fileUri);
                        docLink.tooltip = "Click here to open file";
                    }
                }
                list.push(docLink);
            }
        });
        return list;
    }
}
exports.LinkProvider = LinkProvider;
//# sourceMappingURL=newLinkProvider.js.map