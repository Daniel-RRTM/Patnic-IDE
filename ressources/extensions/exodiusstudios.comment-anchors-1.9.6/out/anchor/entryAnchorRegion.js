"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const entryAnchor_1 = require("./entryAnchor");
/**
 * Represents an Anchor found a file
 */
class EntryAnchorRegion extends entryAnchor_1.default {
    constructor(engine, anchorTag, // The tag e.g. "ANCHOR"
    anchorText, // The text after the anchor tag
    startIndex, // The start column of the anchor
    endIndex, // The end column of the tag
    anchorLength, // The full length of the matched anchor string
    lineNumber, // The line number the tag was found on
    iconColor, // The icon color to use
    scope, // The anchor scope
    showLine, // Whether to display line numbers
    file, // The file this anchor is in
    attributes // The attriibutes this tag has
    ) {
        super(engine, anchorTag, anchorText, startIndex, endIndex, anchorLength, lineNumber, iconColor, scope, showLine, file, attributes);
        this.anchorTag = anchorTag;
        this.anchorText = anchorText;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.anchorLength = anchorLength;
        this.lineNumber = lineNumber;
        this.iconColor = iconColor;
        this.scope = scope;
        this.showLine = showLine;
        this.file = file;
        this.attributes = attributes;
        this.closeStartIndex = -1;
        this.closeEndIndex = -1;
        this.closeLineNumber = -1;
        this.label = showLine ? `[${lineNumber} - ?] ${anchorText}` : anchorText;
        const autoExpand = engine._config.tags.expandSections;
        this.collapsibleState = autoExpand ? vscode_1.TreeItemCollapsibleState.Expanded : vscode_1.TreeItemCollapsibleState.Collapsed;
    }
    setEndTag(endTag) {
        this.closeStartIndex = endTag.startIndex;
        this.closeEndIndex = endTag.endIndex;
        this.closeLineNumber = endTag.lineNumber;
        if (this.showLine) {
            this.label = `[${this.lineNumber} - ${endTag.lineNumber}] ${this.anchorText}`;
        }
    }
    decorateDocumentEnd(document, options) {
        if (this.closeStartIndex < 0 || this.closeEndIndex < 0)
            return;
        const startPos = document.positionAt(this.closeStartIndex);
        const endPos = document.positionAt(this.closeEndIndex);
        options.push({
            hoverMessage: "Comment Anchor End Region: " + this.anchorText,
            range: new vscode_1.Range(startPos, endPos),
        });
    }
    toString() {
        return "EntryAnchorRegion(" + this.label + ")";
    }
    copy(copyChilds) {
        const copy = new EntryAnchorRegion(this.engine, this.anchorTag, this.anchorText, this.startIndex, this.endIndex, this.anchorLength, this.lineNumber, this.iconColor, this.scope, this.showLine, this.file, this.attributes);
        if (this.closeStartIndex >= 0) {
            copy.setEndTag({
                startIndex: this.closeStartIndex,
                endIndex: this.closeEndIndex,
                lineNumber: this.closeLineNumber,
            });
        }
        if (copyChilds) {
            this.children.forEach((child) => {
                copy.addChild(child.copy(copyChilds));
            });
        }
        return copy;
    }
}
exports.default = EntryAnchorRegion;
//# sourceMappingURL=entryAnchorRegion.js.map