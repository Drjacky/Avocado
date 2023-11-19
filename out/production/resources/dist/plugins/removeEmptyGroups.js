"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fn(item) {
    return item.isElem('group') && !item.hasAttr('android:name') && item.isEmpty()
        ? undefined
        : item;
}
exports.removeEmptyGroups = {
    type: 'perItemReverse',
    active: true,
    description: 'removes empty groups',
    params: undefined,
    fn: fn,
};
//# sourceMappingURL=removeEmptyGroups.js.map