"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const entryBase_1 = require("./entryBase");
/**
 * Represents an Anchor found a file
 */
class EntryAnchor extends entryBase_1.default {
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
        super(engine, showLine ? `[${lineNumber}] ${anchorText}` : anchorText);
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
        /**
         * Child anchors, only present when this anchor is a region type
         */
        this.childAnchors = [];
        this.contextValue = "anchor";
        this.tooltip = `${this.anchorText} (Click to reveal)`;
        this.command = {
            title: "",
            command: "commentAnchors.openFileAndRevealLine",
            arguments: [
                {
                    uri: file,
                    lineNumber: this.lineNumber - 1,
                    at: EntryAnchor.ScrollPosition,
                },
            ],
        };
        if (iconColor == "default" || iconColor == "auto") {
            this.iconPath = {
                light: this.loadResourceSvg("anchor_black"),
                dark: this.loadResourceSvg("anchor_white"),
            };
        }
        else {
            this.iconPath = this.loadCacheSvg(iconColor);
        }
    }
    get isHidden() {
        return this.scope == "hidden";
    }
    get isVisibleInWorkspace() {
        return this.scope == "workspace";
    }
    get children() {
        return [...this.childAnchors];
    }
    getAnchorRange(document, includeText) {
        let ending;
        if (includeText) {
            ending = this.startIndex + this.anchorLength;
        }
        else {
            ending = this.endIndex;
        }
        return new vscode_1.Range(document.positionAt(this.startIndex), document.positionAt(ending));
    }
    decorateDocument(document, options) {
        options.push({
            hoverMessage: "Comment Anchor: " + this.anchorText,
            range: this.getAnchorRange(document, false),
        });
    }
    addChild(child) {
        this.childAnchors.push(child);
    }
    toString() {
        return "EntryAnchor(" + this.label + ")";
    }
    copy(copyChilds, showLine = undefined) {
        const copy = new EntryAnchor(this.engine, this.anchorTag, this.anchorText, this.startIndex, this.endIndex, this.anchorLength, this.lineNumber, this.iconColor, this.scope, showLine === undefined ? this.showLine : showLine, this.file, this.attributes);
        if (copyChilds) {
            this.children.forEach((child) => {
                copy.addChild(child.copy(copyChilds, showLine));
            });
        }
        return copy;
    }
    /**
     * Sort anchors based on the currently defined sort method
     *
     * @param anchors Anchors to sort
     */
    static sortAnchors(anchors) {
        return anchors.sort((left, right) => {
            switch (this.SortMethod) {
                case "line": {
                    return left.startIndex - right.startIndex;
                }
                case "type": {
                    return left.anchorTag.localeCompare(right.anchorTag);
                }
                default: {
                    vscode_1.window.showErrorMessage("Invalid sorting method: " + this.SortMethod);
                    return 0;
                }
            }
        });
    }
}
exports.default = EntryAnchor;
/** The sorting method to use, defaults to line */
EntryAnchor.SortMethod = "line";
/** The position of the anchor when scrolled to */
EntryAnchor.ScrollPosition = "top";
//# sourceMappingURL=entryAnchor.js.map