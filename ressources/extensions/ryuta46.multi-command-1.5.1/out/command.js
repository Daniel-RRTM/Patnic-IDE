"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const vscode = require("vscode");
class Command {
    constructor(exe, args) {
        this.exe = exe;
        this.args = args;
    }
    execute() {
        if (this.args === null) {
            return vscode.commands.executeCommand(this.exe);
        }
        else {
            return vscode.commands.executeCommand(this.exe, this.args);
        }
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map