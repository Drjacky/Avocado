"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fn(item) {
    if (!item.isElem() || item.isEmpty()) {
        return item;
    }
    item.content.forEach(function (g, i) {
        if (g.isElem('group') &&
            !g.isEmpty() &&
            !g.hasAttr() &&
            !g.content.some(function (c) { return c.isElem('clip-path'); })) {
            item.spliceContent(i, 1, g.content);
        }
    });
    return item;
}
exports.collapseGroups = {
    type: 'perItemReverse',
    active: true,
    description: 'collapses useless groups',
    params: undefined,
    fn: fn,
};
//# sourceMappingURL=collapseGroups.js.map