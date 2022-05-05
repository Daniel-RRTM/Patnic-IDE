"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnchorEngine = void 0;
const debounce = require("debounce");
const escape = require("escape-string-regexp");
const fs = require("fs");
const path = require("path");
const vscode_1 = require("vscode");
const epicAnchorProvider_1 = require("./provider/epicAnchorProvider");
const anchorIndex_1 = require("./anchorIndex");
const entryAnchor_1 = require("./anchor/entryAnchor");
const entryAnchorRegion_1 = require("./anchor/entryAnchorRegion");
const entryError_1 = require("./anchor/entryError");
const entryLoading_1 = require("./anchor/entryLoading");
const entryScan_1 = require("./anchor/entryScan");
const fileAnchorProvider_1 = require("./provider/fileAnchorProvider");
const linkProvider_1 = require("./util/linkProvider");
const workspaceAnchorProvider_1 = require("./provider/workspaceAnchorProvider");
const asyncDelay_1 = require("./util/asyncDelay");
const anchorListView_1 = require("./anchorListView");
const flattener_1 = require("./util/flattener");
const defaultTags_1 = require("./util/defaultTags");
const completionProvider_1 = require("./util/completionProvider");
/* -- Constants -- */
const HEX_COLOR_REGEX = /^#([\da-f]{3}){1,2}$/i;
const COLOR_PLACEHOLDER_REGEX = /%COLOR%/g;
const MATCHER_TAG_INDEX = 1;
const MATCHER_ATTR_INDEX = 2;
const MATCHER_COMMENT_INDEX = 5;
/**
 * The main anchor parsing and caching engine
 */
class AnchorEngine {
    constructor(context) {
        /** Then event emitter in charge of refreshing the file trees */
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        /** Then event emitter in charge of refreshing the document link */
        this._onDidChangeLinkData = new vscode_1.EventEmitter();
        /** A cache holding all documents */
        this.anchorMaps = new Map();
        /** List of folds created by anchor regions */
        // public foldMaps: Map<Uri, FoldingRange[]> = new Map();
        /** The decorators used for decorating the anchors */
        this.anchorDecorators = new Map();
        /** The decorators used for decorating the region end anchors */
        this.anchorEndDecorators = new Map();
        /** The list of tags and their settings */
        this.tags = new Map();
        /** Returns true when all anchors have been loaded */
        this.anchorsLoaded = false;
        /** Holds whether a scan has been performed since rebuild */
        this.anchorsScanned = false;
        /** Holds whether anchors may be outdated */
        this.anchorsDirty = true;
        /** The currently expanded file tree items */
        this.expandedFileTreeViewItems = [];
        /** The currently expanded workspace tree items  */
        this.expandedWorkspaceTreeViewItems = [];
        /** The icon cache directory */
        this.iconCache = "";
        /** List of build subscriptions */
        this._subscriptions = [];
        // Possible error entries //
        this.errorUnusableItem = new entryError_1.default(this, "Waiting for open editor...");
        this.errorEmptyItem = new entryError_1.default(this, "No comment anchors detected");
        this.errorEmptyWorkspace = new entryError_1.default(this, "No comment anchors in workspace");
        this.errorEmptyEpics = new entryError_1.default(this, "No epics found in workspace");
        this.errorWorkspaceDisabled = new entryError_1.default(this, "Workspace disabled");
        this.errorFileOnly = new entryError_1.default(this, "No open workspaces");
        this.statusLoading = new entryLoading_1.default(this);
        this.statusScan = new entryScan_1.default(this);
        this.context = context;
        vscode_1.window.onDidChangeActiveTextEditor((e) => this.onActiveEditorChanged(e), this, context.subscriptions);
        vscode_1.workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e), this, context.subscriptions);
        vscode_1.workspace.onDidChangeConfiguration(() => this.buildResources(), this, context.subscriptions);
        vscode_1.workspace.onDidChangeWorkspaceFolders(() => this.buildResources(), this, context.subscriptions);
        vscode_1.workspace.onDidCloseTextDocument((e) => this.cleanUp(e), this, context.subscriptions);
        const outputChannel = vscode_1.window.createOutputChannel("Comment Anchors");
        AnchorEngine.output = (m) => outputChannel.appendLine("[Comment Anchors] " + m);
        if (vscode_1.window.activeTextEditor) {
            this._editor = vscode_1.window.activeTextEditor;
        }
        // Build required anchor resources
        this.buildResources();
        // Create the file anchor view
        this.fileTreeView = vscode_1.window.createTreeView("fileAnchors", {
            treeDataProvider: new fileAnchorProvider_1.FileAnchorProvider(this),
            showCollapseAll: true,
        });
        this.fileTreeView.onDidExpandElement((e) => {
            if (e.element instanceof entryAnchor_1.default) {
                this.expandedFileTreeViewItems.push(e.element.anchorText);
            }
        });
        this.fileTreeView.onDidCollapseElement((e) => {
            if (e.element instanceof entryAnchor_1.default) {
                const idx = this.expandedFileTreeViewItems.indexOf(e.element.anchorText);
                this.expandedFileTreeViewItems.splice(idx, 1);
            }
        });
        // Create the workspace anchor view
        this.workspaceTreeView = vscode_1.window.createTreeView("workspaceAnchors", {
            treeDataProvider: new workspaceAnchorProvider_1.WorkspaceAnchorProvider(this),
            showCollapseAll: true,
        });
        this.workspaceTreeView.onDidExpandElement((e) => {
            if (e.element instanceof entryAnchor_1.default) {
                this.expandedWorkspaceTreeViewItems.push(e.element.anchorText);
            }
        });
        this.workspaceTreeView.onDidCollapseElement((e) => {
            if (e.element instanceof entryAnchor_1.default) {
                const idx = this.expandedWorkspaceTreeViewItems.indexOf(e.element.anchorText);
                this.expandedWorkspaceTreeViewItems.splice(idx, 1);
            }
        });
        // Create the workspace anchor view
        this.epicTreeView = vscode_1.window.createTreeView("epicAnchors", {
            treeDataProvider: new epicAnchorProvider_1.EpicAnchorProvider(this),
            showCollapseAll: true,
        });
        // Setup the link provider
        const provider = new linkProvider_1.LinkProvider(this);
        this.linkDisposable = vscode_1.languages.registerDocumentLinkProvider({ language: "*" }, provider);
        this.linkProvider = provider;
        // const provider = new LinkCodeLensProvider(this);
        // this.linkDisposable = languages.registerCodeLensProvider({ language: "*" }, provider);
        // this.linkProvider = provider;
    }
    registerProviders() {
        const config = this._config;
        // Provide auto completion
        if (config.tags.provideAutoCompletion) {
            this._subscriptions.push(completionProvider_1.setupCompletionProvider(this));
        }
        // Provide epic auto complete
        if (config.epic.provideAutoCompletion) {
            this._subscriptions.push(vscode_1.languages.registerCompletionItemProvider({ language: "*" }, new epicAnchorProvider_1.EpicAnchorIntelliSenseProvider(this), "["));
        }
    }
    buildResources() {
        try {
            this.anchorsScanned = false;
            const config = (this._config = vscode_1.workspace.getConfiguration("commentAnchors"));
            // Construct the debounce
            this._idleRefresh = debounce(() => {
                if (this._editor)
                    this.parse(this._editor.document.uri).then(() => {
                        this.refresh();
                    });
            }, config.parseDelay);
            // Disable previous build resources
            this._subscriptions.forEach((s) => s.dispose());
            this._subscriptions = [];
            // Store the sorting method
            if (config.tags.sortMethod && (config.tags.sortMethod == "line" || config.tags.sortMethod == "type")) {
                entryAnchor_1.default.SortMethod = config.tags.sortMethod;
            }
            // Store the scroll position
            if (config.scrollPosition) {
                entryAnchor_1.default.ScrollPosition = config.scrollPosition;
            }
            // Prepare icon cache
            const storage = this.context.globalStoragePath;
            const iconCache = path.join(storage, "icons");
            const baseAnchorSrc = path.join(__dirname, "../res/anchor.svg");
            const baseAnchorEndSrc = path.join(__dirname, "../res/anchor_end.svg");
            const baseAnchor = fs.readFileSync(baseAnchorSrc, "utf8");
            const baseAnchorEnd = fs.readFileSync(baseAnchorEndSrc, "utf8");
            const iconColors = [];
            const regionColors = [];
            if (!fs.existsSync(storage))
                fs.mkdirSync(storage);
            if (!fs.existsSync(iconCache))
                fs.mkdirSync(iconCache);
            this.iconCache = iconCache;
            // Clear icon cache
            fs.readdirSync(iconCache).forEach((file) => {
                fs.unlinkSync(path.join(iconCache, file));
            });
            // Create a map holding the tags
            this.tags.clear();
            this.anchorDecorators.forEach((type) => type.dispose());
            this.anchorDecorators.clear();
            this.anchorEndDecorators.forEach((type) => type.dispose());
            this.anchorEndDecorators.clear();
            // Register default tags
            defaultTags_1.default(this.tags);
            // Add custom tags
            config.tags.list.forEach((tag) => {
                const def = this.tags.get(tag.tag.toUpperCase()) || {};
                const opts = { ...def, ...tag };
                // Skip disabled default tags
                if (tag.enabled === false) {
                    this.tags.delete(tag.tag.toUpperCase());
                    return;
                }
                // Fix legacy isRegion tag
                if (opts.isRegion) {
                    opts.behavior = "region";
                }
                this.tags.set(tag.tag.toUpperCase(), opts);
            });
            // Detect the lane style
            let laneStyle;
            if (config.tags.rulerStyle == "left") {
                laneStyle = vscode_1.OverviewRulerLane.Left;
            }
            else if (config.tags.rulerStyle == "right") {
                laneStyle = vscode_1.OverviewRulerLane.Right;
            }
            else if (config.tags.rulerStyle == "center") {
                laneStyle = vscode_1.OverviewRulerLane.Center;
            }
            else {
                laneStyle = vscode_1.OverviewRulerLane.Full;
            }
            // Start the cursor tracker
            if (this.cursorTask) {
                clearInterval(this.cursorTask);
            }
            let prevLine = 0;
            if (config.showCursor) {
                this.cursorTask = setInterval(() => {
                    var _a, _b, _c;
                    const cursor = (_c = (_b = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.selection) === null || _b === void 0 ? void 0 : _b.active) === null || _c === void 0 ? void 0 : _c.line;
                    if (cursor !== undefined && prevLine != cursor) {
                        AnchorEngine.output("Updating cursor position");
                        this._onDidChangeTreeData.fire();
                        prevLine = cursor;
                    }
                }, 100);
            }
            // Configure all tags
            Array.from(this.tags.values()).forEach((tag) => {
                if (!tag.scope) {
                    tag.scope = "workspace";
                }
                if (config.tagHighlights.enabled) {
                    // Create base configuration
                    let highlight = {
                        fontWeight: tag.isBold || tag.isBold == undefined ? "bold" : "normal",
                        fontStyle: tag.isItalic || tag.isItalic == undefined ? "italic" : "normal",
                        color: tag.highlightColor,
                        backgroundColor: tag.backgroundColor,
                    };
                    // Optionally insert rulers
                    if (config.tags.displayInRuler) {
                        highlight.overviewRulerColor = tag.highlightColor;
                        highlight.overviewRulerLane = laneStyle;
                    }
                    // Optional border
                    if (tag.borderStyle) {
                        highlight = {
                            ...highlight,
                            border: tag.borderStyle,
                            borderRadius: tag.borderRadius + "px",
                        };
                    }
                    // Save the icon color
                    let iconColor = tag.iconColor || tag.highlightColor;
                    let skipColor = false;
                    switch (iconColor) {
                        case "blue": {
                            iconColor = "#3ea8ff";
                            break;
                        }
                        case "blurple": {
                            iconColor = "#7d5afc";
                            break;
                        }
                        case "red": {
                            iconColor = "#f44336";
                            break;
                        }
                        case "purple": {
                            iconColor = "#ba68c8";
                            break;
                        }
                        case "teal": {
                            iconColor = "#00cec9";
                            break;
                        }
                        case "orange": {
                            iconColor = "#ffa100";
                            break;
                        }
                        case "green": {
                            iconColor = "#64dd17";
                            break;
                        }
                        case "pink": {
                            iconColor = "#e84393";
                            break;
                        }
                        case "emerald": {
                            iconColor = "#2ecc71";
                            break;
                        }
                        case "yellow": {
                            iconColor = "#f4d13d";
                            break;
                        }
                        case "default":
                        case "auto": {
                            skipColor = true;
                            break;
                        }
                        default: {
                            if (!iconColor.match(HEX_COLOR_REGEX)) {
                                skipColor = true;
                                vscode_1.window.showErrorMessage("Invalid color: " + iconColor);
                            }
                        }
                    }
                    if (skipColor) {
                        tag.iconColor = "auto";
                    }
                    else {
                        iconColor = iconColor.substr(1);
                        if (iconColors.indexOf(iconColor) < 0) {
                            iconColors.push(iconColor);
                        }
                        if (tag.behavior == "region" && regionColors.indexOf(iconColor) < 0) {
                            regionColors.push(iconColor);
                        }
                        tag.iconColor = iconColor.toLowerCase();
                    }
                    // Optional gutter icons
                    if (config.tags.displayInGutter) {
                        if (tag.iconColor == "auto") {
                            highlight.dark = {
                                gutterIconPath: path.join(__dirname, "..", "res", "anchor_white.svg"),
                            };
                            highlight.light = {
                                gutterIconPath: path.join(__dirname, "..", "res", "anchor_black.svg"),
                            };
                        }
                        else {
                            highlight.gutterIconPath = path.join(iconCache, "anchor_" + tag.iconColor + ".svg");
                        }
                    }
                    // Create the decoration type
                    this.anchorDecorators.set(tag.tag, vscode_1.window.createTextEditorDecorationType(highlight));
                    if (tag.behavior == "region") {
                        const endHighlight = { ...highlight };
                        // Optional gutter icons
                        if (config.tags.displayInGutter) {
                            if (tag.iconColor == "auto") {
                                endHighlight.dark = {
                                    gutterIconPath: path.join(__dirname, "..", "res", "anchor_end_white.svg"),
                                };
                                endHighlight.light = {
                                    gutterIconPath: path.join(__dirname, "..", "res", "anchor_end_black.svg"),
                                };
                            }
                            else {
                                endHighlight.gutterIconPath = path.join(iconCache, "anchor_end_" + tag.iconColor + ".svg");
                            }
                        }
                        // Create the ending decoration type
                        this.anchorEndDecorators.set(tag.tag, vscode_1.window.createTextEditorDecorationType(endHighlight));
                    }
                }
            });
            // Fetch an array of tags
            const matchTags = Array.from(this.tags.keys());
            // Generate region end tags
            const endTag = this._config.tags.endTag;
            this.tags.forEach((entry, tag) => {
                if (entry.behavior == "region") {
                    matchTags.push(endTag + tag);
                }
            });
            // Create a matcher for the tags
            const tags = matchTags
                .map((tag) => escape(tag))
                .sort((left, right) => right.length - left.length)
                .join("|");
            if (tags.length === 0) {
                vscode_1.window.showErrorMessage("At least one tag must be defined");
                return;
            }
            // Construct a list of separators [ +|: +| +- +]
            const separators = config.tags.separators
                .map((seperator) => escape(seperator).replace(/ /g, " +"))
                .sort((left, right) => right.length - left.length)
                .join("|");
            AnchorEngine.output("Tags: " + tags);
            AnchorEngine.output("Separators: " + separators);
            if (separators.length === 0) {
                vscode_1.window.showErrorMessage("At least one separator must be defined");
                return;
            }
            // ANCHOR: Tag RegEx
            this.matcher = new RegExp(`[^\\w](${tags})(\\[.*\\])?((${separators})(.*))?`, config.tags.matchCase ? "gm" : "img");
            AnchorEngine.output("Using matcher " + this.matcher);
            // Write anchor icons
            iconColors.forEach((color) => {
                const filename = "anchor_" + color.toLowerCase() + ".svg";
                const anchorSvg = baseAnchor.replace(COLOR_PLACEHOLDER_REGEX, "#" + color);
                fs.writeFileSync(path.join(iconCache, filename), anchorSvg);
                if (regionColors.indexOf(color) >= 0) {
                    const filenameEnd = "anchor_end_" + color.toLowerCase() + ".svg";
                    const anchorEndSvg = baseAnchorEnd.replace(COLOR_PLACEHOLDER_REGEX, "#" + color);
                    fs.writeFileSync(path.join(iconCache, filenameEnd), anchorEndSvg);
                }
            });
            AnchorEngine.output("Generated icon cache at " + iconCache);
            // Scan in all workspace files
            if (config.workspace.enabled && !config.workspace.lazyLoad) {
                setTimeout(() => {
                    this.initiateWorkspaceScan();
                }, 500);
            }
            else {
                this.anchorsLoaded = true;
                if (this._editor) {
                    this.addMap(this._editor.document.uri);
                }
                this.refresh();
            }
            // Dispose the existing file watcher
            if (this._watcher) {
                this._watcher.dispose();
            }
            // Create a new file watcher
            if (config.workspace.enabled) {
                this._watcher = vscode_1.workspace.createFileSystemWatcher(config.workspace.matchFiles, true, true, false);
                this._watcher.onDidDelete((file) => {
                    this.anchorMaps.forEach((_, uri) => {
                        if (uri.toString() == file.toString()) {
                            this.removeMap(uri);
                            return false;
                        }
                    });
                });
            }
            // Register editor providers
            this.registerProviders();
        }
        catch (err) {
            AnchorEngine.output("Failed to build resources: " + err.message);
            AnchorEngine.output(err);
        }
    }
    initiateWorkspaceScan() {
        const config = this._config;
        this.anchorsScanned = true;
        this.anchorsLoaded = false;
        // Find all files located in this workspace
        vscode_1.workspace.findFiles(config.workspace.matchFiles, config.workspace.excludeFiles).then((uris) => {
            // Clear all existing mappings
            this.anchorMaps.clear();
            // Resolve all matched URIs
            this.loadWorkspace(uris)
                .then(() => {
                if (this._editor) {
                    this.addMap(this._editor.document.uri);
                }
                this.anchorsLoaded = true;
                this.refresh();
            })
                .catch((err) => {
                vscode_1.window.showErrorMessage("Comment Anchors failed to load: " + err);
                AnchorEngine.output(err);
            });
        });
        // Update workspace tree
        this._onDidChangeTreeData.fire();
    }
    async loadWorkspace(uris) {
        const maxFiles = this._config.workspace.maxFiles;
        const parseStatus = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 0);
        let parseCount = 0;
        let parsePercentage = 0;
        parseStatus.tooltip = "Provided by the Comment Anchors extension";
        parseStatus.text = `$(telescope) Initializing...`;
        parseStatus.show();
        for (let i = 0; i < uris.length && parseCount < maxFiles; i++) {
            // Await a timeout for every 10 documents parsed. This allows
            // all files to be slowly parsed without completely blocking
            // the main thread for the entire process.
            if (i % 10 == 0) {
                await asyncDelay_1.asyncDelay(5);
            }
            try {
                const found = await this.addMap(uris[i]);
                // Only update states when a file containing anchors
                // was found and parsed.
                if (found) {
                    parseCount++;
                    parsePercentage = (parseCount / uris.length) * 100;
                    parseStatus.text = `$(telescope) Parsing Comment Anchors... (${parsePercentage.toFixed(1)}%)`;
                }
            }
            catch (err) {
                // Ignore, already taken care of
            }
        }
        // Scanning has now completed
        parseStatus.text = `Comment Anchors loaded!`;
        setTimeout(() => {
            parseStatus.dispose();
        }, 3000);
    }
    /**
     * Returns the anchors in the current document
     */
    get currentAnchors() {
        if (!this._editor)
            return [];
        const uri = this._editor.document.uri;
        if (this.anchorMaps.has(uri)) {
            return this.anchorMaps.get(uri).anchorTree;
        }
        else {
            return [];
        }
    }
    /**
     * Dispose anchor list resources
     */
    dispose() {
        this.anchorDecorators.forEach((type) => type.dispose());
        this.anchorEndDecorators.forEach((type) => type.dispose());
        this._subscriptions.forEach((s) => s.dispose());
        this.linkDisposable.dispose();
        if (this.cursorTask) {
            clearInterval(this.cursorTask);
        }
    }
    /**
     * Clean up external files
     */
    cleanUp(document) {
        if (document.uri.scheme != "file")
            return;
        const ws = vscode_1.workspace.getWorkspaceFolder(document.uri);
        if (this._config.workspace.enabled && ws && this.anchorsScanned)
            return;
        this.removeMap(document.uri);
    }
    /**
     * Travel to the specified anchor id
     *
     * @param The anchor id
     */
    travelToAnchor(id) {
        if (!this._editor)
            return;
        const anchors = this.currentAnchors;
        const flattened = flattener_1.flattenAnchors(anchors);
        for (const anchor of flattened) {
            if (anchor.attributes.id == id) {
                const targetLine = anchor.lineNumber - 1;
                vscode_1.commands.executeCommand("revealLine", {
                    lineNumber: targetLine,
                    at: entryAnchor_1.default.ScrollPosition,
                });
                return;
            }
        }
    }
    /**
     * Parse the given raw attribute string into
     * individual attributes.
     *
     * @param raw The raw attribute string
     * @param defaultValue The default attributes
     */
    parseAttributes(raw, defaultValue) {
        if (!raw)
            return defaultValue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = { ...defaultValue };
        const mapping = new Map();
        // parse all 'key1=value1,key2=value2'
        raw.split(",").forEach((pair) => {
            const [key, value] = pair.trim().split("=");
            AnchorEngine.output(`Trying to set key=${key},value=${value}`);
            mapping.set(key, value);
        });
        // Parse the epic value
        if (mapping.has("epic")) {
            result.epic = mapping.get("epic");
        }
        // Parse the sequence value
        if (mapping.has("seq")) {
            result.seq = parseInt(mapping.get("seq"), 10);
        }
        // Parse the id value
        if (mapping.has("id")) {
            result.id = mapping.get("id");
        }
        return result;
    }
    /**
     * Parse the given or current document
     *
     * @returns true when anchors were found
     */
    parse(document) {
        return new Promise(async (success, reject) => {
            let anchorsFound = false;
            try {
                let text = null;
                vscode_1.workspace.textDocuments.forEach((td) => {
                    if (td.uri == document) {
                        text = td.getText();
                        return false;
                    }
                });
                if (text == null) {
                    text = await this.readDocument(document);
                }
                const currRegions = [];
                const anchors = [];
                const folds = [];
                let match;
                const config = this._config;
                const endTag = config.tags.endTag;
                // Find all anchor occurences
                while ((match = this.matcher.exec(text))) {
                    const tagName = match[MATCHER_TAG_INDEX].toUpperCase().replace(endTag, "");
                    const tag = this.tags.get(tagName);
                    const isRegionStart = tag.behavior == "region";
                    const isRegionEnd = match[MATCHER_TAG_INDEX].startsWith(endTag);
                    const currRegion = currRegions.length ? currRegions[currRegions.length - 1] : null;
                    // We have found at least one anchor
                    anchorsFound = true;
                    // Handle the closing of a region
                    if (isRegionEnd) {
                        if (!currRegion || currRegion.anchorTag != tag.tag)
                            continue;
                        const deltaText = text.substr(0, match.index + 1);
                        const lineNumber = deltaText.split(/\r\n|\r|\n/g).length;
                        currRegion.setEndTag({
                            startIndex: match.index + 1,
                            endIndex: match.index + 1 + match[MATCHER_TAG_INDEX].length,
                            lineNumber: lineNumber,
                        });
                        currRegions.pop();
                        folds.push(new vscode_1.FoldingRange(currRegion.lineNumber - 1, lineNumber - 1, vscode_1.FoldingRangeKind.Comment));
                        continue;
                    }
                    const rangeLength = tag.styleComment ? match[0].length - 1 : tag.tag.length;
                    const startPos = match.index + 1;
                    const deltaText = text.substr(0, startPos);
                    const lineNumber = deltaText.split(/\r\n|\r|\n/g).length;
                    let endPos = startPos + rangeLength;
                    let comment = (match[MATCHER_COMMENT_INDEX] || "").trim();
                    let display = "";
                    const rawAttributeStr = match[MATCHER_ATTR_INDEX] || "[]";
                    const attributes = this.parseAttributes(rawAttributeStr.substr(1, rawAttributeStr.length - 2), {
                        seq: lineNumber,
                    });
                    // Clean up the comment and adjust the endPos
                    if (comment.endsWith("-->")) {
                        if (tag.styleComment) {
                            const skip = [" ", "-", ">"];
                            let end = comment.length - 1;
                            while (skip.indexOf(comment[end]) >= 0) {
                                endPos--;
                                end--;
                            }
                        }
                        comment = comment.substring(0, comment.lastIndexOf("-->"));
                    }
                    else if (comment.endsWith("*/")) {
                        if (tag.styleComment) {
                            const skip = [" ", "*", "/"];
                            let end = comment.length - 1;
                            while (skip.indexOf(comment[end]) >= 0) {
                                endPos--;
                                end--;
                            }
                        }
                        comment = comment.substring(0, comment.lastIndexOf("*/"));
                    }
                    comment = comment.trim();
                    if (comment.length == 0) {
                        display = tag.tag;
                    }
                    else if (config.tags.displayInSidebar && tag.behavior != "link") {
                        display = tag.tag + ": " + comment;
                    }
                    else {
                        display = comment;
                    }
                    // Remove epics when tag is not workspace visible
                    if (tag.scope != "workspace") {
                        attributes.epic = undefined;
                    }
                    let anchor;
                    // Create a regular or region anchor
                    const displayLineNumber = config.tags.displayLineNumber;
                    if (isRegionStart) {
                        anchor = new entryAnchorRegion_1.default(this, tag.tag, display, startPos, endPos, match[0].length - 1, lineNumber, tag.iconColor, tag.scope, displayLineNumber, document, attributes);
                    }
                    else {
                        anchor = new entryAnchor_1.default(this, tag.tag, display, startPos, endPos, match[0].length - 1, lineNumber, tag.iconColor, tag.scope, displayLineNumber, document, attributes);
                    }
                    // Push this region onto the stack
                    if (isRegionStart) {
                        currRegions.push(anchor);
                    }
                    // Place this anchor on root or child level
                    if (currRegion) {
                        currRegion.addChild(anchor);
                    }
                    else {
                        anchors.push(anchor);
                    }
                }
                this.matcher.lastIndex = 0;
                this.anchorMaps.set(document, new anchorIndex_1.AnchorIndex(anchors));
                // this.foldMaps.set(document, folds);
            }
            catch (err) {
                AnchorEngine.output("Error: " + err.message);
                AnchorEngine.output(err.stack);
                reject(err);
            }
            finally {
                success(anchorsFound);
            }
        });
    }
    /**
     * Returns the list of anchors parsed from the given
     * file.
     *
     * @param file The file URI
     * @returns The anchor array
     */
    async getAnchors(file) {
        var _a;
        const cached = (_a = this.anchorMaps.get(file)) === null || _a === void 0 ? void 0 : _a.anchorTree;
        if (cached) {
            return Promise.resolve(cached);
        }
        else {
            await this.parse(file);
            return await this.getAnchors(file);
        }
    }
    /**
     * Refresh the visual representation of the anchors
     */
    refresh() {
        if (this._editor && this._config.tagHighlights.enabled) {
            const document = this._editor.document;
            const doc = document.uri;
            const index = this.anchorMaps.get(doc);
            const tags = new Map();
            const tagsEnd = new Map();
            // Create a mapping between tags and decorators
            this.anchorDecorators.forEach((decorator, tag) => {
                tags.set(tag.toUpperCase(), [decorator, []]);
            });
            this.anchorEndDecorators.forEach((decorator, tag) => {
                tagsEnd.set(tag.toUpperCase(), [decorator, []]);
            });
            // Create a function to handle decorating
            const applyDecorators = (anchors) => {
                anchors.forEach((anchor) => {
                    const deco = tags.get(anchor.anchorTag.toUpperCase())[1];
                    anchor.decorateDocument(document, deco);
                    if (anchor instanceof entryAnchorRegion_1.default) {
                        anchor.decorateDocumentEnd(document, tagsEnd.get(anchor.anchorTag.toUpperCase())[1]);
                    }
                    if (anchor.children) {
                        applyDecorators(anchor.children);
                    }
                });
            };
            // Start by decorating the root list
            if (index) {
                applyDecorators(index.anchorTree);
            }
            // Apply all decorators to the document
            tags.forEach((decorator) => {
                this._editor.setDecorations(decorator[0], decorator[1]);
            });
            tagsEnd.forEach((decorator) => {
                this._editor.setDecorations(decorator[0], decorator[1]);
            });
        }
        // Reset the expansion arrays
        this.expandedFileTreeViewItems = [];
        this.expandedWorkspaceTreeViewItems = [];
        // Update the file trees
        this._onDidChangeLinkData.fire();
        this._onDidChangeTreeData.fire();
        this.anchorsDirty = false;
    }
    /**
     * Add a TextDocument mapping to the engine
     *
     * @param document TextDocument
     */
    addMap(document) {
        if (document.scheme !== "file") {
            return Promise.resolve(false);
        }
        // Make sure we have no duplicates
        this.anchorMaps.forEach((_, doc) => {
            if (doc.path == document.path) {
                this.anchorMaps.delete(doc);
                return false;
            }
        });
        this.anchorMaps.set(document, anchorIndex_1.AnchorIndex.EMPTY);
        return this.parse(document);
    }
    /**
     * Remove a TextDocument mapping from the engine
     *
     * @param editor textDocument
     */
    removeMap(document) {
        if (document.scheme !== "file")
            return;
        this.anchorMaps.delete(document);
    }
    /**
     * Open a new webview panel listing out all configured
     * tags including their applied styles.
     */
    openTagListPanel() {
        const panel = vscode_1.window.createWebviewPanel("anchorList", "Comment Anchors Tags", {
            viewColumn: vscode_1.ViewColumn.One,
        });
        panel.webview.html = anchorListView_1.createViewContent(this, panel.webview);
    }
    onActiveEditorChanged(editor) {
        if (editor && editor.document.uri.scheme == "output")
            return;
        this._editor = editor;
        if (!this.anchorsLoaded)
            return;
        if (editor && !this.anchorMaps.has(editor.document.uri)) {
            // Bugfix - Replace duplicates
            new Map(this.anchorMaps).forEach((_, document) => {
                if (document.path.toString() == editor.document.uri.path.toString()) {
                    this.anchorMaps.delete(document);
                    return false;
                }
            });
            this.anchorMaps.set(editor.document.uri, anchorIndex_1.AnchorIndex.EMPTY);
            this.parse(editor.document.uri).then(() => {
                this.refresh();
            });
        }
        else {
            this.refresh();
        }
    }
    onDocumentChanged(e) {
        if (!e.contentChanges || e.document.uri.scheme == "output")
            return;
        this.anchorsDirty = true;
        this._idleRefresh();
    }
    /**
     * Reads the document at the given Uri async
     *
     * @param path Document uri
     */
    readDocument(path) {
        return new Promise((success, reject) => {
            fs.readFile(path.fsPath, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    success(data);
                }
            });
        });
    }
}
exports.AnchorEngine = AnchorEngine;
//# sourceMappingURL=anchorEngine.js.map