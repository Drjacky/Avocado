"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var regValidPath = /M\s*(?:[-+]?(?:\d*\.\d+|\d+(?:\.|(?!\.)))([eE][-+]?\d+)?(?!\d)\s*,?\s*){2}\D*\d/i;
function fn(item) {
    if (!item.isElem() || item.hasAttr('android:name')) {
        return item;
    }
    if ((item.isElem('path') || item.isElem('clip-path')) &&
        (!item.hasAttr('android:pathData') ||
            !regValidPath.test(item.attr('android:pathData').value))) {
        return undefined;
    }
    return item;
}
exports.removeHiddenElems = {
    type: 'perItem',
    active: true,
    description: 'removes hidden elements',
    params: undefined,
    fn: fn,
};
//# sourceMappingURL=removeHiddenElems.js.map