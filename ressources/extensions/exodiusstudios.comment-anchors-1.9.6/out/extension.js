"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const anchorEngine_1 = require("./anchorEngine");
let anchorEngine;
// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
function activate(context) {
    const engine = new anchorEngine_1.AnchorEngine(context);
    // Register extension commands
    vscode_1.commands.registerCommand("commentAnchors.parse", parseCurrentAnchors);
    vscode_1.commands.registerCommand("commentAnchors.toggle", toggleVisibilitySetting);
    vscode_1.commands.registerCommand("commentAnchors.openFileAndRevealLine", openFileAndRevealLine);
    vscode_1.commands.registerCommand("commentAnchors.launchWorkspaceScan", launchWorkspaceScan);
    vscode_1.commands.registerCommand("commentAnchors.listTags", () => engine.openTagListPanel());
    // Store a reference to the engine
    anchorEngine = engine;
}
exports.activate = activate;
function deactivate() {
    anchorEngine.dispose();
}
exports.deactivate = deactivate;
/**
 * Reparse anchors in the current file
 */
function parseCurrentAnchors() {
    if (!vscode_1.window.activeTextEditor)
        return;
    anchorEngine.parse(vscode_1.window.activeTextEditor.document.uri);
}
/**
 * Luanch the workspace scan
 */
function launchWorkspaceScan() {
    anchorEngine.initiateWorkspaceScan();
}
/**
 * Toggles the visibility of comment anchors
 */
function toggleVisibilitySetting() {
    const config = vscode_1.workspace.getConfiguration("commentAnchors");
    config.update("tagHighlights.enabled", !config.tagHighlights.enabled);
}
/**
 * Opens a file and reveales the given line number
 */
function openFileAndRevealLine(options) {
    if (!options)
        return;
    function scrollAndMove() {
        vscode_1.commands.executeCommand("revealLine", {
            lineNumber: options.lineNumber,
            at: options.at,
        });
    }
    // Either open right away or wait for the document to open
    if (vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.document.uri == options.uri) {
        scrollAndMove();
    }
    else {
        vscode_1.workspace.openTextDocument(options.uri).then((doc) => {
            vscode_1.window.showTextDocument(doc).then(() => {
                scrollAndMove();
            });
        });
    }
}
//# sourceMappingURL=extension.js.map