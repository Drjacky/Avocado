"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fn(item) {
    return item.processingInstruction && item.processingInstruction.name === 'xml'
        ? undefined
        : item;
}
exports.removeXMLProcInst = {
    type: 'perItem',
    active: false,
    description: 'removes XML processing instructions',
    params: undefined,
    fn: fn,
};
//# sourceMappingURL=removeXMLProcInst.js.map