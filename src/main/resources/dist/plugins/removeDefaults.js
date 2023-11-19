"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defaultAttrs = {
    vector: {
        alpha: 1,
        autoMirrored: 'false',
        tintMode: 'src_in',
    },
    group: {
        pivotX: 0,
        pivotY: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        translateX: 0,
        translateY: 0,
    },
    path: {
        fillAlpha: 1,
        fillColor: '#00000000',
        fillType: 'nonZero',
        strokeAlpha: 1,
        strokeColor: '#00000000',
        strokeLineCap: 'butt',
        strokeLineJoin: 'miter',
        strokeMiterLimit: 4,
        trimPathStart: 0,
        trimPathEnd: 1,
        trimPathOffset: 0,
    },
};
function fn(item) {
    if (!item.isElem() || !item.attrs) {
        return item;
    }
    if (item.isElem('vector') || item.isElem('group') || item.isElem('path')) {
        var elemType = item.elem;
        var defaults_1 = defaultAttrs[elemType];
        Object.keys(defaults_1).forEach(function (key) {
            var attrName = "android:" + key;
            if (item.hasAttr(attrName)) {
                var defaultValue = defaults_1[key];
                var actualValue = item.attr(attrName).value;
                var convertedValue = typeof defaultValue === 'number' ? +actualValue : actualValue;
                if (defaultValue === convertedValue) {
                    item.removeAttr(attrName);
                }
            }
        });
    }
    return item;
}
exports.fn = fn;
exports.removeDefaults = {
    type: 'perItem',
    active: true,
    description: 'remove attributes with default values',
    params: undefined,
    fn: fn,
};
//# sourceMappingURL=removeDefaults.js.map