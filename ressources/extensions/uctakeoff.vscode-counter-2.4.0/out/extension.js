'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const LineCounter_1 = require("./LineCounter");
const Gitignore_1 = require("./Gitignore");
const minimatch = require("minimatch");
const vscode_utils_1 = require("./vscode-utils");
const EXTENSION_ID = 'uctakeoff.vscode-counter';
const EXTENSION_NAME = 'VSCodeCounter';
const CONFIGURATION_SECTION = 'VSCodeCounter';
const toZeroPadString = (num, fig) => num.toString().padStart(fig, '0');
const toLocalDateString = (date, delims = ['-', ' ', ':']) => {
    return `${date.getFullYear()}${delims[0]}${toZeroPadString(date.getMonth() + 1, 2)}${delims[0]}${toZeroPadString(date.getDate(), 2)}${delims[1]}`
        + `${toZeroPadString(date.getHours(), 2)}${delims[2]}${toZeroPadString(date.getMinutes(), 2)}${delims[2]}${toZeroPadString(date.getSeconds(), 2)}`;
};
const toStringWithCommas = (obj) => {
    if (typeof obj === 'number') {
        return new Intl.NumberFormat('en-US').format(obj);
    }
    else {
        return obj.toString();
    }
};
const sleep = (msec) => new Promise(resolve => setTimeout(resolve, msec));
const log = (message, ...items) => console.log(`${new Date().toISOString()} ${message}`, ...items);
const showError = (message, ...items) => vscode.window.showErrorMessage(`[${EXTENSION_NAME}] ${message}`, ...items);
const registerCommand = (command, callback, thisArg) => {
    return vscode.commands.registerCommand(`extension.vscode-counter.${command}`, async (...args) => {
        try {
            await callback(...args);
        }
        catch (e) {
            showError(`"${command}" failed.`, e.message);
        }
    }, thisArg);
};
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const activate = (context) => {
    var _a, _b;
    const version = (_b = (_a = vscode.extensions.getExtension(EXTENSION_ID)) === null || _a === void 0 ? void 0 : _a.packageJSON) === null || _b === void 0 ? void 0 : _b.version;
    log(`${EXTENSION_ID} ver.${version} now active! : ${context.extensionPath}`);
    const codeCountController = new CodeCounterController();
    context.subscriptions.push(codeCountController, registerCommand('countInWorkspace', () => codeCountController.countLinesInWorkSpace()), registerCommand('countInDirectory', (targetDir) => codeCountController.countLinesInDirectory(targetDir)), registerCommand('countInFile', () => codeCountController.toggleVisible()), registerCommand('saveLanguageConfigurations', () => codeCountController.saveLanguageConfigurations()), registerCommand('outputAvailableLanguages', () => codeCountController.outputAvailableLanguages()));
};
exports.activate = activate;
// this method is called when your extension is deactivated
const deactivate = () => { };
exports.deactivate = deactivate;
const loadConfig = () => {
    const conf = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
    const confFiles = vscode.workspace.getConfiguration("files", null);
    const include = conf.get('include', ['**/*']);
    const exclude = conf.get('exclude', []);
    if (conf.get('useFilesExclude', true)) {
        exclude.push(...Object.keys(confFiles.get('exclude', {})));
    }
    return {
        configuration: conf,
        saveLocation: conf.get('saveLocation', 'global settings'),
        outputDirectory: conf.get('outputDirectory', '.VSCodeCounter'),
        // include: `{${include.join(',')}}`,
        // exclude: `{${exclude.join(',')}}`,
        include: include.join(','),
        exclude: exclude.join(','),
        useGitignore: conf.get('useGitignore', true),
        encoding: confFiles.get('encoding', 'utf8'),
        associations: Object.entries(confFiles.get('associations', {})),
        maxOpenFiles: conf.get('maxOpenFiles', 500),
        ignoreUnsupportedFile: conf.get('ignoreUnsupportedFile', true),
        history: Math.max(1, conf.get('history', 5)),
        languages: conf.get('languages', {}),
        endOfLine: conf.get('endOfLine', '\n'),
        printNumberWithCommas: conf.get('printNumberWithCommas', true),
        outputPreviewType: conf.get('outputPreviewType', ''),
        outputAsText: conf.get('outputAsText', true),
        outputAsCSV: conf.get('outputAsCSV', true),
        outputAsMarkdown: conf.get('outputAsMarkdown', true),
    };
};
class CodeCounterController {
    constructor() {
        this.codeCounter_ = null;
        this.statusBarItem = null;
        this.outputChannel = null;
        // subscribe to selection change and editor activation events
        let subscriptions = [];
        vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this, subscriptions);
        vscode.window.onDidChangeTextEditorSelection(this.onDidChangeTextEditorSelection, this, subscriptions);
        vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this, subscriptions);
        vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this, subscriptions);
        // vscode.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders, this, subscriptions);
        this.conf = loadConfig();
        // create a combined disposable from both event subscriptions
        this.disposable = vscode.Disposable.from(...subscriptions);
    }
    dispose() {
        var _a, _b;
        (_a = this.statusBarItem) === null || _a === void 0 ? void 0 : _a.dispose();
        this.statusBarItem = null;
        (_b = this.outputChannel) === null || _b === void 0 ? void 0 : _b.dispose();
        this.outputChannel = null;
        this.disposable.dispose();
        this.codeCounter_ = null;
    }
    // private onDidChangeWorkspaceFolders(e: vscode.WorkspaceFoldersChangeEvent) {
    //     log(`onDidChangeWorkspaceFolders()`);
    //     // e.added.forEach((f) =>   log(` added   [${f.index}] ${f.name} : ${f.uri}`));
    //     // e.removed.forEach((f) => log(` removed [${f.index}] ${f.name} : ${f.uri}`));
    //     // vscode.workspace.workspaceFolders?.forEach((f) => log(` [${f.index}] ${f.name} : ${f.uri}`));
    // }
    onDidChangeActiveTextEditor(e) {
        if (this.codeCounter_) {
            // log(`onDidChangeActiveTextEditor(${!e ? 'undefined' : e.document.uri})`);
            this.countLinesInEditor(e);
        }
    }
    onDidChangeTextEditorSelection(e) {
        if (this.codeCounter_) {
            // log(`onDidChangeTextEditorSelection(${e.selections.length}selections, ${e.selections[0].isEmpty} )`, e.selections[0]);
            this.countLinesInEditor(e.textEditor);
        }
    }
    onDidChangeTextDocument(e) {
        if (this.codeCounter_) {
            // log(`onDidChangeTextDocument(${e.document.uri})`);
            this.countLinesOfFile(e.document);
        }
    }
    onDidChangeConfiguration() {
        // log(`onDidChangeConfiguration()`);
        this.codeCounter_ = null;
        this.conf = loadConfig();
        this.countLinesInEditor(vscode.window.activeTextEditor);
    }
    toggleVisible() {
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100000);
            this.countLinesInEditor(vscode.window.activeTextEditor);
        }
        else {
            this.statusBarItem.dispose();
            this.statusBarItem = null;
        }
    }
    async getCodeCounter() {
        if (this.codeCounter_) {
            return this.codeCounter_;
        }
        const langs = objectToMap(await loadLanguageConfigurations(this.conf));
        log(`load Language Settings = ${langs.size}`);
        await collectLanguageConfigurations(langs);
        log(`collect Language Settings = ${langs.size}`);
        this.codeCounter_ = new LineCounterTable(langs, this.conf.associations);
        return this.codeCounter_;
    }
    async saveLanguageConfigurations() {
        const c = await this.getCodeCounter();
        saveLanguageConfigurations(mapToObject(c.entries()), this.conf);
    }
    async outputAvailableLanguages() {
        const c = await this.getCodeCounter();
        c.entries().forEach((lang, id) => {
            this.toOutputChannel(`${id} : aliases[${lang.aliases}], extensions[${lang.extensions}], filenames:[${lang.filenames}]`);
        });
        this.toOutputChannel(`VS Code Counter : available all ${c.entries().size} languages.`);
    }
    async countLinesInDirectory(targetDir) {
        const folder = await (0, vscode_utils_1.currentWorkspaceFolder)();
        if (targetDir) {
            this.countLinesInDirectory_(targetDir, folder.uri);
        }
        else {
            const option = {
                value: folder.uri.toString(true),
                placeHolder: "Input Directory Path",
                prompt: "Input Directory Path. "
            };
            const uri = await vscode.window.showInputBox(option);
            if (uri) {
                this.countLinesInDirectory_(vscode.Uri.parse(uri), folder.uri);
            }
        }
    }
    async countLinesInWorkSpace() {
        const folder = await (0, vscode_utils_1.currentWorkspaceFolder)();
        this.countLinesInDirectory_(folder.uri, folder.uri);
    }
    async countLinesInDirectory_(targetUri, workspaceDir) {
        const date = new Date();
        const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        try {
            statusBar.show();
            statusBar.text = `VSCodeCounter: Preparing...`;
            const outputDir = (0, vscode_utils_1.buildUri)(workspaceDir, this.conf.outputDirectory);
            log(`include : "${this.conf.include}"`);
            log(`exclude : "${this.conf.exclude}"`);
            const files = await vscode.workspace.findFiles(`{${this.conf.include}}`, `{${this.conf.exclude},${vscode.workspace.asRelativePath(outputDir)}}`);
            let targetFiles = files.filter(uri => !path.relative(targetUri.path, uri.path).startsWith(".."));
            if (this.conf.useGitignore) {
                log(`target : ${targetFiles.length} files -> use .gitignore`);
                const gitignores = await loadGitIgnore();
                targetFiles = targetFiles.filter(p => gitignores.excludes(p.fsPath));
            }
            const counter = await this.getCodeCounter();
            const results = await countLines(counter, targetFiles, this.conf.maxOpenFiles, this.conf.encoding, this.conf.ignoreUnsupportedFile, (msg) => statusBar.text = `VSCodeCounter: ${msg}`);
            if (results.length <= 0) {
                throw Error(`There was no target file.`);
            }
            statusBar.text = `VSCodeCounter: Totaling...`;
            const regex = /^\d\d\d\d-\d\d-\d\d\_\d\d-\d\d-\d\d$/;
            const histories = (await vscode.workspace.fs.readDirectory(outputDir))
                .filter(d => ((d[1] & vscode.FileType.Directory) != 0) && regex.test(d[0]))
                .map(d => d[0])
                .sort()
                .map(d => (0, vscode_utils_1.buildUri)(outputDir, d));
            const outSubdir = (0, vscode_utils_1.buildUri)(outputDir, toLocalDateString(date, ['-', '_', '-']));
            await outputResults(date, targetUri, results, outSubdir, histories[histories.length - 1], this.conf);
            if (histories.length >= this.conf.history) {
                histories.length -= this.conf.history - 1;
                histories.forEach(dir => vscode.workspace.fs.delete(dir, { recursive: true }));
            }
        }
        finally {
            log(`finished. ${(new Date().getTime() - date.getTime())}ms`);
            statusBar.dispose();
        }
    }
    async countLinesInEditor(editor) {
        const doc = editor === null || editor === void 0 ? void 0 : editor.document;
        if (!editor || !doc) {
            this.showStatusBar();
        }
        else if (editor.selection.isEmpty) {
            await this.countLinesOfFile(doc);
        }
        else {
            const c = await this.getCodeCounter();
            const lineCounter = c.getById(doc.languageId) || c.getByUri(doc.uri);
            if (lineCounter) {
                const result = editor.selections
                    .map(s => lineCounter.count(doc.getText(s)))
                    .reduce((prev, cur) => prev.add(cur), new LineCounter_1.Count());
                this.showStatusBar(`Selected Code:${result.code} Comment:${result.comment} Blank:${result.blank}`);
            }
            else {
                this.showStatusBar();
            }
        }
    }
    async countLinesOfFile(doc) {
        if (!doc) {
            this.showStatusBar();
        }
        else {
            const c = await this.getCodeCounter();
            const lineCounter = c.getById(doc.languageId) || c.getByUri(doc.uri);
            if (lineCounter) {
                const result = lineCounter === null || lineCounter === void 0 ? void 0 : lineCounter.count(doc.getText());
                this.showStatusBar(`Code:${result.code} Comment:${result.comment} Blank:${result.blank}`);
            }
            else {
                this.showStatusBar();
            }
        }
    }
    showStatusBar(text) {
        if (this.statusBarItem) {
            this.statusBarItem.show();
            this.statusBarItem.text = text !== null && text !== void 0 ? text : `${EXTENSION_NAME}:Unsupported`;
        }
    }
    toOutputChannel(text) {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel(EXTENSION_NAME);
        }
        this.outputChannel.show();
        this.outputChannel.appendLine(text);
    }
}
const loadGitIgnore = async () => {
    const gitignoreFiles = await vscode.workspace.findFiles('**/.gitignore', '');
    gitignoreFiles.forEach(f => log(`use gitignore : ${f}`));
    const values = await (0, vscode_utils_1.readTextFiles)(gitignoreFiles.sort());
    return new Gitignore_1.default('').merge(...values.map(p => { var _a; return new Gitignore_1.default((_a = p.data) !== null && _a !== void 0 ? _a : '', (0, vscode_utils_1.dirUri)(p.uri).fsPath); }));
};
const countLines = (lineCounterTable, fileUris, maxOpenFiles, fileEncoding, ignoreUnsupportedFile, showStatus) => {
    log(`countLines : target ${fileUris.length} files`);
    return new Promise(async (resolve, reject) => {
        const results = [];
        if (fileUris.length <= 0) {
            resolve(results);
        }
        const decoder = (0, vscode_utils_1.createTextDecoder)(fileEncoding);
        const totalFiles = fileUris.length;
        let fileCount = 0;
        const onFinish = () => {
            ++fileCount;
            if (fileCount === totalFiles) {
                log(`count finished : total:${totalFiles} valid:${results.length}`);
                resolve(results);
            }
        };
        for (let i = 0; i < totalFiles; ++i) {
            const fileUri = fileUris[i];
            const lineCounter = lineCounterTable.getByUri(fileUri);
            if (lineCounter) {
                while ((i - fileCount) >= maxOpenFiles) {
                    // log(`sleep : total:${totalFiles} current:${i} finished:${fileCount} valid:${results.length}`);
                    showStatus(`${fileCount}/${totalFiles}`);
                    await sleep(50);
                }
                vscode.workspace.fs.readFile(fileUri).then(data => {
                    try {
                        results.push(new Result(fileUri, lineCounter.name, lineCounter.count(decoder.decode(data))));
                    }
                    catch (e) {
                        log(`"${fileUri}" Read Error : ${e.message}.`);
                        results.push(new Result(fileUri, '(Read Error)'));
                    }
                    onFinish();
                }, (reason) => {
                    log(`"${fileUri}" Read Error : ${reason}.`);
                    results.push(new Result(fileUri, '(Read Error)'));
                    onFinish();
                });
            }
            else {
                if (!ignoreUnsupportedFile) {
                    results.push(new Result(fileUri, '(Unsupported)'));
                }
                onFinish();
            }
        }
    });
};
const pushUnique = (array, value) => {
    if (array.indexOf(value) < 0) {
        array.push(value);
    }
};
const append = (langs, l) => {
    var _a, _b, _c;
    const langExt = getOrSet(langs, l.id, () => {
        return {
            aliases: [],
            filenames: [],
            extensions: [],
            lineComments: [],
            blockComments: [],
            blockStrings: []
        };
    });
    // l.aliases?.filter(v => langExt.aliases.indexOf(v) < 0).forEach(v => langExt.aliases.push(v));
    // l.filenames?.filter(v => langExt.filenames.indexOf(v) < 0).forEach(v => langExt.filenames.push(v));
    // l.extensions?.filter(v => langExt.extensions.indexOf(v) < 0).forEach(v => langExt.extensions.push(v));
    (_a = l.aliases) === null || _a === void 0 ? void 0 : _a.forEach(v => pushUnique(langExt.aliases, v));
    (_b = l.filenames) === null || _b === void 0 ? void 0 : _b.forEach(v => pushUnique(langExt.filenames, v));
    (_c = l.extensions) === null || _c === void 0 ? void 0 : _c.forEach(v => pushUnique(langExt.extensions, v));
    return langExt;
};
const collectLanguageConfigurations = (langs) => {
    return new Promise((resolve, reject) => {
        if (vscode.extensions.all.length <= 0) {
            resolve(langs);
        }
        else {
            let finishedCount = 0;
            let totalCount = 0;
            vscode.extensions.all.forEach(ex => {
                var _a, _b;
                const languages = (_b = (_a = ex.packageJSON.contributes) === null || _a === void 0 ? void 0 : _a.languages) !== null && _b !== void 0 ? _b : undefined;
                if (languages) {
                    totalCount += languages.length;
                    languages.forEach(l => {
                        const langExt = append(langs, l);
                        if (l.configuration) {
                            const confUrl = vscode.Uri.file(path.join(ex.extensionPath, l.configuration));
                            (0, vscode_utils_1.readJsonFile)(confUrl).then((langConf) => {
                                // log(`${confUrl} ${data.length}B :${l.id}`);
                                if (langConf.comments) {
                                    if (langConf.comments.lineComment) {
                                        pushUnique(langExt.lineComments, langConf.comments.lineComment);
                                    }
                                    if (langConf.comments.blockComment && langConf.comments.blockComment.length >= 2) {
                                        pushUnique(langExt.blockComments, langConf.comments.blockComment);
                                    }
                                }
                                if (++finishedCount >= totalCount) {
                                    resolve(langs);
                                }
                            }, (reason) => {
                                log(`${confUrl} : error ${reason}`);
                                if (++finishedCount >= totalCount) {
                                    resolve(langs);
                                }
                            });
                        }
                        else {
                            if (++finishedCount >= totalCount) {
                                resolve(langs);
                            }
                        }
                    });
                }
            });
        }
    });
};
const saveLanguageConfigurations = async (langs, conf) => {
    switch (conf.saveLocation) {
        case "global settings":
            conf.configuration.update('languages', langs, vscode.ConfigurationTarget.Global);
            break;
        case "workspace settings":
            conf.configuration.update('languages', langs, vscode.ConfigurationTarget.Workspace);
            break;
        case "output directory":
            const workFolder = await (0, vscode_utils_1.currentWorkspaceFolder)();
            const outputDir = (0, vscode_utils_1.buildUri)(workFolder.uri, conf.outputDirectory);
            await (0, vscode_utils_1.makeDirectories)(outputDir);
            await (0, vscode_utils_1.writeTextFile)(outputDir, 'languages.json', JSON.stringify(langs));
            break;
        default: break;
    }
};
const loadLanguageConfigurations = async (conf) => {
    try {
        switch (conf.saveLocation) {
            case "global settings":
            case "workspace settings":
                return conf.languages;
            case "output directory":
                const workFolder = await (0, vscode_utils_1.currentWorkspaceFolder)();
                const outputDir = (0, vscode_utils_1.buildUri)(workFolder.uri, conf.outputDirectory);
                return await (0, vscode_utils_1.readJsonFile)(outputDir, 'languages.json');
            default: break;
        }
    }
    catch (e) {
        log(`loadLanguageConfigurations failed. ${e.message}`);
    }
    return {};
};
class LineCounterTable {
    constructor(langExtensions, associations) {
        this.langExtensions = langExtensions;
        this.associations = associations;
        this.langIdTable = new Map();
        this.aliasTable = new Map();
        this.fileextRules = new Map();
        this.filenameRules = new Map();
        this.entries = () => this.langExtensions;
        log(`associations : ${this.associations.length}\n[${this.associations.join("],[")}]`);
        langExtensions.forEach((lang, id) => {
            const langName = lang.aliases.length > 0 ? lang.aliases[0] : id;
            const lineCounter = new LineCounter_1.LineCounter(langName, lang.lineComments, lang.blockComments, lang.blockStrings);
            lang.aliases.forEach(v => this.aliasTable.set(v, lineCounter));
            lang.extensions.forEach(v => this.fileextRules.set(v.startsWith('.') ? v : `.${v}`, lineCounter));
            lang.filenames.forEach(v => this.filenameRules.set(v, lineCounter));
        });
    }
    getById(langId) {
        return this.langIdTable.get(langId) || this.aliasTable.get(langId);
    }
    getByPath(filePath) {
        const lineCounter = this.fileextRules.get(filePath) || this.fileextRules.get(path.extname(filePath)) || this.filenameRules.get(path.basename(filePath));
        if (lineCounter !== undefined) {
            return lineCounter;
        }
        const patType = this.associations.find(([pattern,]) => minimatch(filePath, pattern, { matchBase: true }));
        //log(`## ${filePath}: ${patType}`);
        return (patType !== undefined) ? this.getById(patType[1]) : undefined;
    }
    getByUri(uri) {
        return this.getByPath(uri.fsPath);
    }
}
const outputFiles = new Map([
    ['text', 'results.txt'],
    ['diff-text', 'diff.txt'],
    ['csv', 'results.csv'],
    ['diff-csv', 'diff.csv'],
    ['markdown', 'results.md'],
    ['diff-markdown', 'diff.md'],
]);
const outputResults = async (date, targetDirUri, results, outputDir, prevOutputDir, conf) => {
    await (0, vscode_utils_1.makeDirectories)(outputDir);
    (0, vscode_utils_1.writeTextFile)(outputDir, `results.json`, resultsToJson(results));
    const resultTable = new ResultFormatter(targetDirUri, results, conf.endOfLine, conf.printNumberWithCommas ? toStringWithCommas : undefined);
    log(`OutputDir : ${outputDir}, count ${results.length} files`);
    const diffs = [];
    if (prevOutputDir) {
        try {
            const prevResults = await (0, vscode_utils_1.readJsonFile)(prevOutputDir, 'results.json');
            log(`Previous OutputDir : ${prevOutputDir}, count ${prevResults.length} files`);
            results.map(r => {
                const p = prevResults[r.uri.toString()];
                const diff = p ? r.clone().sub(p) : r;
                if (!diff.isEmpty) {
                    diffs.push(diff);
                }
            });
        }
        catch (e) {
            log(`failed to access previous "results.json"`);
            diffs.length = 0;
        }
    }
    const diffTable = new ResultFormatter(targetDirUri, diffs, conf.endOfLine, conf.printNumberWithCommas ? toStringWithCommas : undefined);
    if (conf.outputAsText) {
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'results.txt', resultTable.toTextLines(date));
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'diff.txt', diffTable.toTextLines(date));
    }
    if (conf.outputAsCSV) {
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'results.csv', resultTable.toCSVLines());
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'diff.csv', diffTable.toCSVLines());
    }
    if (conf.outputAsMarkdown) {
        const links = [
            ['summary', 'results.md'],
            ['details', 'details.md'],
            ['diff summary', 'diff.md'],
            ['diff details', 'diff-details.md'],
            // ['Previous', prevOutputDir ? '/' + vscode.workspace.asRelativePath(buildUri(prevOutputDir, 'results.md')) : undefined],
        ];
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'results.md', resultTable.toMarkdown(date, 'Summary', false, links.map((l, i) => i === 0 ? [l[0], undefined] : l)));
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'details.md', resultTable.toMarkdown(date, 'Details', true, links.map((l, i) => i === 1 ? [l[0], undefined] : l)));
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'diff.md', diffTable.toMarkdown(date, 'Diff Summary', false, links.map((l, i) => i === 2 ? [l[0], undefined] : l)));
        await (0, vscode_utils_1.writeTextFile)(outputDir, 'diff-details.md', diffTable.toMarkdown(date, 'Diff Details', true, links.map((l, i) => i === 3 ? [l[0], undefined] : l)));
    }
    const previewFile = outputFiles.get(conf.outputPreviewType);
    if (previewFile) {
        (0, vscode_utils_1.showTextPreview)((0, vscode_utils_1.buildUri)(outputDir, previewFile));
    }
};
class Result extends LineCounter_1.Count {
    constructor(uri, language, count = { code: 0, comment: 0, blank: 0 }) {
        super(count.code, count.comment, count.blank);
        this.uri = uri;
        this.filename = uri.fsPath;
        this.language = language;
    }
    clone() {
        return new Result(this.uri, this.language, this);
    }
}
const resultsToJson = (results) => {
    const obj = {};
    results.forEach(({ uri, language, code, comment, blank }) => obj[uri.toString()] = { language, code, comment, blank });
    // return JSON.stringify(obj, undefined, 2);
    return JSON.stringify(obj);
};
class Statistics extends LineCounter_1.Count {
    constructor(name) {
        super();
        this.files = 0;
        this.name = name;
    }
    add(value) {
        this.files++;
        return super.add(value);
    }
}
class MarkdownTableFormatter {
    constructor(valueToString, ...columnInfo) {
        this.valueToString = valueToString;
        this.columnInfo = columnInfo;
    }
    get lineSeparator() {
        return '| ' + this.columnInfo.map(i => (i.format === 'number') ? '---:' : ':---').join(' | ') + ' |';
    }
    get headerLines() {
        return ['| ' + this.columnInfo.map(i => i.title).join(' | ') + ' |', this.lineSeparator];
    }
    line(...data) {
        return '| ' + data.map((d, i) => {
            if (typeof d === 'number') {
                return this.valueToString(d);
            }
            if (typeof d === 'string') {
                return d;
            }
            const relativePath = vscode.workspace.asRelativePath(d);
            return `[${relativePath}](/${relativePath})`;
        }).join(' | ') + ' |';
    }
}
class ResultFormatter {
    constructor(targetDirUri, results, endOfLine, valueToString = (obj) => obj.toString()) {
        this.targetDirUri = targetDirUri;
        this.results = results;
        this.endOfLine = endOfLine;
        this.valueToString = valueToString;
        this.dirResultTable = new Map();
        this.langResultTable = new Map();
        this.total = new Statistics('Total');
        results.forEach((result) => {
            let parent = path.dirname(path.relative(this.targetDirUri.fsPath, result.filename));
            while (parent.length >= 0) {
                getOrSet(this.dirResultTable, parent, () => new Statistics(parent)).add(result);
                const p = path.dirname(parent);
                if (p === parent) {
                    break;
                }
                parent = p;
            }
            getOrSet(this.langResultTable, result.language, () => new Statistics(result.language)).add(result);
            this.total.add(result);
        });
    }
    toCSVLines() {
        const languages = [...this.langResultTable.keys()];
        return [
            `"filename", "language", "${languages.join('", "')}", "comment", "blank", "total"`,
            ...this.results.sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0)
                .map(v => `"${v.filename}", "${v.language}", ${languages.map(l => l === v.language ? v.code : 0).join(', ')}, ${v.comment}, ${v.blank}, ${v.total}`),
            `"Total", "-", ${[...this.langResultTable.values()].map(r => r.code).join(', ')}, ${this.total.comment}, ${this.total.blank}, ${this.total.total}`
        ].join(this.endOfLine);
    }
    toTextLines(date) {
        class TextTableFormatter {
            constructor(valueToString, ...columnInfo) {
                this.valueToString = valueToString;
                this.columnInfo = columnInfo;
                for (const info of this.columnInfo) {
                    info.width = Math.max(info.title.length, info.width);
                }
            }
            get lineSeparator() {
                return '+-' + this.columnInfo.map(i => '-'.repeat(i.width)).join('-+-') + '-+';
            }
            get headerLines() {
                return [this.lineSeparator, '| ' + this.columnInfo.map(i => i.title.padEnd(i.width)).join(' | ') + ' |', this.lineSeparator];
            }
            get footerLines() {
                return [this.lineSeparator];
            }
            line(...data) {
                return '| ' + data.map((d, i) => {
                    if (typeof d === 'string') {
                        return d.padEnd(this.columnInfo[i].width);
                    }
                    else {
                        return this.valueToString(d).padStart(this.columnInfo[i].width);
                    }
                }).join(' | ') + ' |';
            }
        }
        const maxNamelen = Math.max(...this.results.map(res => res.filename.length));
        const maxLanglen = Math.max(...[...this.langResultTable.keys()].map(l => l.length));
        const resultFormat = new TextTableFormatter(this.valueToString, { title: 'filename', width: maxNamelen }, { title: 'language', width: maxLanglen }, { title: 'code', width: 10 }, { title: 'comment', width: 10 }, { title: 'blank', width: 10 }, { title: 'total', width: 10 });
        const dirFormat = new TextTableFormatter(this.valueToString, { title: 'path', width: maxNamelen }, { title: 'files', width: 10 }, { title: 'code', width: 10 }, { title: 'comment', width: 10 }, { title: 'blank', width: 10 }, { title: 'total', width: 10 });
        const langFormat = new TextTableFormatter(this.valueToString, { title: 'language', width: maxLanglen }, { title: 'files', width: 10 }, { title: 'code', width: 10 }, { title: 'comment', width: 10 }, { title: 'blank', width: 10 }, { title: 'total', width: 10 });
        return [
            `Date : ${toLocalDateString(date)}`,
            `Directory : ${this.targetDirUri.fsPath}`,
            // `Total : code: ${this.total.code}, comment : ${this.total.comment}, blank : ${this.total.blank}, all ${this.total.total} lines`,
            `Total : ${this.total.files} files,  ${this.total.code} codes, ${this.total.comment} comments, ${this.total.blank} blanks, all ${this.total.total} lines`,
            '',
            'Languages',
            ...langFormat.headerLines,
            ...[...this.langResultTable.values()].sort((a, b) => b.code - a.code)
                .map(v => langFormat.line(v.name, v.files, v.code, v.comment, v.blank, v.total)),
            ...langFormat.footerLines,
            '',
            'Directories',
            ...dirFormat.headerLines,
            ...[...this.dirResultTable.values()].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
                .map(v => dirFormat.line(v.name, v.files, v.code, v.comment, v.blank, v.total)),
            ...dirFormat.footerLines,
            '',
            'Files',
            ...resultFormat.headerLines,
            ...this.results.sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0)
                .map(v => resultFormat.line(v.filename, v.language, v.code, v.comment, v.blank, v.total)),
            resultFormat.line('Total', '', this.total.code, this.total.comment, this.total.blank, this.total.total),
            ...resultFormat.footerLines,
        ].join(this.endOfLine);
    }
    /*
        toMarkdown(date: Date) {
            return [
                ...this.toMarkdownHeaderLines(date),
                '',
                ...this.toMarkdownSummaryLines(),
                '',
                ...this.toMarkdownDetailsLines(),
            ].join(this.endOfLine);
        }
    */
    toMarkdown(date, title, detail, links) {
        const linksStr = links.map(l => l[1] ? `[${l[0]}](${l[1]})` : l[0]).join(' / ');
        return [
            `# ${title}`,
            '',
            ...this.toMarkdownHeaderLines(date),
            '',
            linksStr,
            '',
            ...(detail ? this.toMarkdownDetailsLines() : this.toMarkdownSummaryLines()),
            '',
            linksStr,
        ].join(this.endOfLine);
    }
    toMarkdownHeaderLines(date) {
        return [
            `Date : ${toLocalDateString(date)}`,
            '',
            `Directory ${this.targetDirUri.fsPath}`,
            '',
            `Total : ${this.total.files} files,  ${this.total.code} codes, ${this.total.comment} comments, ${this.total.blank} blanks, all ${this.total.total} lines`,
        ];
    }
    toMarkdownSummaryLines() {
        const dirFormat = new MarkdownTableFormatter(this.valueToString, { title: 'path', format: 'string' }, { title: 'files', format: 'number' }, { title: 'code', format: 'number' }, { title: 'comment', format: 'number' }, { title: 'blank', format: 'number' }, { title: 'total', format: 'number' });
        const langFormat = new MarkdownTableFormatter(this.valueToString, { title: 'language', format: 'string' }, { title: 'files', format: 'number' }, { title: 'code', format: 'number' }, { title: 'comment', format: 'number' }, { title: 'blank', format: 'number' }, { title: 'total', format: 'number' });
        return [
            '## Languages',
            ...langFormat.headerLines,
            ...[...this.langResultTable.values()].sort((a, b) => b.code - a.code)
                .map(v => langFormat.line(v.name, v.files, v.code, v.comment, v.blank, v.total)),
            '',
            '## Directories',
            ...dirFormat.headerLines,
            ...[...this.dirResultTable.values()].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
                .map(v => dirFormat.line(v.name, v.files, v.code, v.comment, v.blank, v.total)),
        ];
    }
    toMarkdownDetailsLines() {
        const resultFormat = new MarkdownTableFormatter(this.valueToString, { title: 'filename', format: 'uri' }, { title: 'language', format: 'string' }, { title: 'code', format: 'number' }, { title: 'comment', format: 'number' }, { title: 'blank', format: 'number' }, { title: 'total', format: 'number' });
        return [
            '## Files',
            ...resultFormat.headerLines,
            ...this.results.sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0)
                .map(v => resultFormat.line(v.uri, v.language, v.code, v.comment, v.blank, v.total)),
        ];
    }
}
const mapToObject = (map) => {
    const obj = {};
    map.forEach((v, id) => {
        obj[id] = v;
    });
    return obj;
};
const objectToMap = (obj) => {
    return new Map(Object.entries(obj));
};
const getOrSet = (map, key, otherwise) => {
    let v = map.get(key);
    if (v === undefined) {
        v = otherwise();
        map.set(key, v);
    }
    return v;
};
//# sourceMappingURL=extension.js.map