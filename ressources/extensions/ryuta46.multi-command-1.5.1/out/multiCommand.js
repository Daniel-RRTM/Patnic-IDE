"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCommand = void 0;
class MultiCommand {
    constructor(id, label, description, interval, sequence) {
        this.id = id;
        this.label = label;
        this.description = description;
        this.interval = interval;
        this.sequence = sequence;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let command of this.sequence) {
                yield command.execute();
                yield delay(this.interval || 0);
            }
        });
    }
}
exports.MultiCommand = MultiCommand;
function delay(ms) {
    if (ms > 0) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=multiCommand.js.map