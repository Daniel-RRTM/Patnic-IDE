'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineCounter = exports.Count = void 0;
class Count {
    constructor(code = 0, comment = 0, blank = 0) {
        this.code = code;
        this.comment = comment;
        this.blank = blank;
    }
    get total() { return this.code + this.comment + this.blank; }
    get isEmpty() { return (this.code === 0) && (this.comment === 0) && (this.blank === 0); }
    add(value) {
        this.code += value.code;
        this.comment += value.comment;
        this.blank += value.blank;
        return this;
    }
    sub(value) {
        this.code -= value.code;
        this.comment -= value.comment;
        this.blank -= value.blank;
        return this;
    }
}
exports.Count = Count;
;
class LineCounter {
    constructor(name, lineComments, blockComments, blockStrings) {
        this.name = name;
        this.lineComments = lineComments;
        this.blockComments = blockComments;
        this.blockStrings = blockStrings;
    }
    count(text) {
        let LineType;
        (function (LineType) {
            LineType[LineType["Code"] = 0] = "Code";
            LineType[LineType["Comment"] = 1] = "Comment";
            LineType[LineType["Blank"] = 2] = "Blank";
        })(LineType || (LineType = {}));
        const nextIndexOf = (str, searchValue, fromIndex = 0) => {
            const index = str.indexOf(searchValue, fromIndex);
            return (index >= 0) ? index + searchValue.length : index;
        };
        let result = [0, 0, 0];
        let blockCommentEnd = '';
        let blockStringEnd = '';
        text.split(/\r\n|\r|\n/).map(line => line.trim()).forEach((line, lineIndex) => {
            let type = (blockCommentEnd.length > 0) ? LineType.Comment : (blockStringEnd.length > 0) ? LineType.Code : LineType.Blank;
            let i = 0;
            while (i < line.length) {
                // now in block comment
                if (blockCommentEnd.length > 0) {
                    const index = nextIndexOf(line, blockCommentEnd, i);
                    if (index >= 0) {
                        blockCommentEnd = '';
                        i = index;
                    }
                    else {
                        break;
                    }
                    // now in block string (here document)
                }
                else if (blockStringEnd.length > 0) {
                    const index = nextIndexOf(line, blockStringEnd, i);
                    if (index >= 0) {
                        blockStringEnd = '';
                        i = index;
                    }
                    else {
                        break;
                    }
                }
                else {
                    // now is line comment.
                    if (this.lineComments.some(lc => line.startsWith(lc))) {
                        type = LineType.Comment;
                        break;
                    }
                    {
                        let index = -1;
                        const range = this.blockComments.find(bc => { index = line.indexOf(bc[0], i); return index >= 0; });
                        if (range !== undefined) {
                            // start block comment
                            type = index === 0 ? LineType.Comment : LineType.Code;
                            blockCommentEnd = range[1];
                            i = index + range[0].length;
                            continue;
                        }
                    }
                    type = LineType.Code;
                    {
                        let index = -1;
                        const range = this.blockStrings.find(bc => { index = line.indexOf(bc[0], i); return index >= 0; });
                        if (range !== undefined) {
                            blockStringEnd = range[1];
                            i = index + range[0].length;
                            continue;
                        }
                    }
                    break;
                }
            }
            result[type]++;
            // console.log(`${lineIndex+1} [${LineType[type]}]   ${line}`);
        });
        return new Count(result[LineType.Code], result[LineType.Comment], result[LineType.Blank]);
    }
}
exports.LineCounter = LineCounter;
//# sourceMappingURL=LineCounter.js.map