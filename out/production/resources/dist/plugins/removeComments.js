"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fn(item) {
    return item.comment && item.comment.text.charAt(0) !== '!' ? undefined : item;
}
exports.removeComments = {
    type: 'perItem',
    active: false,
    description: 'removes all comments',
    params: undefined,
    fn: fn,
};
//# sourceMappingURL=removeComments.js.map