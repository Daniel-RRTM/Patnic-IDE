"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTextFile = exports.showTextPreview = exports.showTextFile = exports.makeDirectories = exports.readJsonFile = exports.readTextFiles = exports.readTextFile = exports.createTextDecoder = exports.dirUri = exports.buildUri = exports.currentWorkspaceFolder = void 0;
const vscode = require("vscode");
const path = require("path");
const JSONC = require("jsonc-parser");
const util_1 = require("util");
const log = (message, ...items) => console.log(`${new Date().toISOString()}   ${message}`, ...items);
const currentWorkspaceFolder = async () => {
    var _a;
    const folders = (_a = vscode.workspace.workspaceFolders) !== null && _a !== void 0 ? _a : [];
    if (folders.length === 1) {
        return folders[0];
    }
    else if (folders.length > 1) {
        const folder = await vscode.window.showWorkspaceFolderPick();
        if (folder)
            return folder;
    }
    throw Error('workspace not open.');
};
exports.currentWorkspaceFolder = currentWorkspaceFolder;
const buildUri = (uri, ...names) => uri.with({ path: `${uri.path}/${names.join('/')}` });
exports.buildUri = buildUri;
const dirUri = (uri) => uri.with({ path: path.dirname(uri.path) });
exports.dirUri = dirUri;
const decoderU8 = new util_1.TextDecoder('utf8');
const encoderU8 = new util_1.TextEncoder();
const vscodeEncodingTable = new Map([
    ['big5hkscs', 'big5-hkscs'],
    // ['cp437',        ''],
    // ['cp850',        ''],
    // ['cp852',        ''],
    // ['cp865',        ''],
    // ['cp866',        ''],
    // ['cp950',        ''],
    ['eucjp', 'euc-jp'],
    ['euckr', 'euc-kr'],
    // ['gb18030',      ''],
    // ['gb2312',       ''],
    // ['gbk',          ''],
    // ['iso88591',     ''],
    // ['iso885910',    ''],
    // ['iso885911',    ''],
    // ['iso885913',    ''],
    // ['iso885914',    ''],
    // ['iso885915',    ''],
    // ['iso88592',     ''],
    // ['iso88593',     ''],
    // ['iso88594',     ''],
    // ['iso88595',     ''],
    // ['iso88596',     ''],
    // ['iso88597',     ''],
    // ['iso88598',     ''],
    // ['iso88599',     ''],
    ['iso885916', 'iso-8859-16'],
    ['koi8r', 'koi8-r'],
    ['koi8ru', 'koi8-ru'],
    ['koi8t', 'koi8-t'],
    ['koi8u', 'koi8-u'],
    ['macroman', 'x-mac-roman'],
    ['shiftjis', 'shift-jis'],
    ['utf16be', 'utf-16be'],
    ['utf16le', 'utf-16le'],
    // ['utf8',         ''],
    ['utf8bom', 'utf8'],
    ['windows1250', 'windows-1250'],
    ['windows1251', 'windows-1251'],
    ['windows1252', 'windows-1252'],
    ['windows1253', 'windows-1253'],
    ['windows1254', 'windows-1254'],
    ['windows1255', 'windows-1255'],
    ['windows1256', 'windows-1256'],
    ['windows1257', 'windows-1257'],
    ['windows1258', 'windows-1258'],
    ['windows874', 'windows-874'],
]);
const createTextDecoder = (vscodeTextEncoding) => new util_1.TextDecoder(vscodeEncodingTable.get(vscodeTextEncoding) || vscodeTextEncoding);
exports.createTextDecoder = createTextDecoder;
const readTextFile = async (baseUri, path) => {
    const uri = path ? (0, exports.buildUri)(baseUri, path) : baseUri;
    const data = await vscode.workspace.fs.readFile(uri);
    log(`read ${uri} : ${data.length}B`);
    return decoderU8.decode(data);
};
exports.readTextFile = readTextFile;
const readTextFiles = async (uris) => {
    const ret = [];
    for (const uri of uris) {
        try {
            const data = await (0, exports.readTextFile)(uri);
            ret.push({ uri, data });
        }
        catch (error) {
            log(`failed to read ${uri} : ${error}`);
            ret.push({ uri, error });
        }
    }
    return ret;
};
exports.readTextFiles = readTextFiles;
const readJsonFile = async (baseUri, path) => {
    const data = await (0, exports.readTextFile)(baseUri, path);
    return JSONC.parse(data);
};
exports.readJsonFile = readJsonFile;
const makeDirectories_ = (dirpath, resolve, reject) => {
    // log(`makeDirectories(${dirpath})`);
    vscode.workspace.fs.stat(dirpath).then((fileStat) => {
        if ((fileStat.type & vscode.FileType.Directory) != 0) {
            resolve();
        }
        else {
            reject(`${dirpath} is not directory.`);
        }
    }, (reason) => {
        // log(`vscode.workspace.fs.stat failed: ${reason}`);
        const curPath = dirpath.path;
        const parent = path.dirname(curPath);
        if (parent !== curPath) {
            makeDirectories_(dirpath.with({ path: parent }), () => {
                log(`createDirectory ${dirpath}`);
                vscode.workspace.fs.createDirectory(dirpath).then(resolve, reject);
            }, reject);
        }
        else {
            reject(reason);
        }
    });
};
const makeDirectories = (dirpath) => {
    return new Promise((resolve, reject) => makeDirectories_(dirpath, resolve, reject));
};
exports.makeDirectories = makeDirectories;
const showTextFile = async (uri) => {
    const doc = await vscode.workspace.openTextDocument(uri);
    return await vscode.window.showTextDocument(doc, vscode.ViewColumn.One, true);
};
exports.showTextFile = showTextFile;
const showTextPreview = async (uri) => {
    if (uri.path.endsWith('.md')) {
        await vscode.commands.executeCommand("markdown.showPreview", uri);
    }
    else {
        await (0, exports.showTextFile)(uri);
    }
};
exports.showTextPreview = showTextPreview;
const writeTextFile = async (baseUri, path, text) => {
    const uri = (0, exports.buildUri)(baseUri, path);
    // log(`writeTextFile : ${uri} ${text.length}B`);
    await vscode.workspace.fs.writeFile(uri, encoderU8.encode(text));
    return uri;
};
exports.writeTextFile = writeTextFile;
//# sourceMappingURL=vscode-utils.js.map