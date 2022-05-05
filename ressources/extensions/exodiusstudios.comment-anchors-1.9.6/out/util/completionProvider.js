"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCompletionProvider = void 0;
const vscode_1 = require("vscode");
class TagCompletionProvider {
    constructor(engine) {
        this.engine = engine;
    }
    provideCompletionItems(_document, _position, _token, _context) {
        const ret = new vscode_1.CompletionList();
        const config = this.engine._config;
        const separator = config.tags.separators[0];
        const endTag = config.tags.endTag;
        for (const tag of this.engine.tags.values()) {
            const item = new vscode_1.CompletionItem(tag.tag + " Anchor", vscode_1.CompletionItemKind.Reference);
            item.documentation = `Insert ${tag.tag} comment anchor`;
            item.insertText = tag.tag + separator;
            ret.items.push(item);
            if (tag.behavior == "region") {
                const endItem = new vscode_1.CompletionItem(endTag + tag.tag + " Anchor", vscode_1.CompletionItemKind.Reference);
                endItem.insertText = endTag + tag.tag + separator;
                endItem.documentation = `Insert ${endTag + tag.tag} comment anchor`;
                ret.items.push(endItem);
            }
        }
        return ret;
    }
}
function setupCompletionProvider(engine) {
    return vscode_1.languages.registerCompletionItemProvider({ language: "*" }, new TagCompletionProvider(engine));
}
exports.setupCompletionProvider = setupCompletionProvider;
//# sourceMappingURL=completionProvider.js.map