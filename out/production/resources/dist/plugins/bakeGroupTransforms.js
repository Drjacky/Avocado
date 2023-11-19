"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _path_1 = require("./_path");
exports.defaultParams = {
    floatPrecision: 3,
    transformPrecision: 5,
    applyTransformsStroked: true,
};
function fn(item, params) {
    if (!item.isElem('group') ||
        !item.hasAttr() ||
        item.hasAttr('android:name') ||
        item.isEmpty() ||
        item.content.some(function (i) { return i.hasAttr('android:name'); }) ||
        item.content.some(function (i) { return i.isElem('clip-path'); })) {
        return item;
    }
    var floatPrecision = params.floatPrecision;
    var error = +Math.pow(0.1, floatPrecision).toFixed(floatPrecision);
    function strongRound(data) {
        for (var i = data.length; i-- > 0;) {
            if (+data[i].toFixed(floatPrecision) !== data[i]) {
                var rounded = +data[i].toFixed(floatPrecision - 1);
                data[i] =
                    +Math.abs(rounded - data[i]).toFixed(floatPrecision + 1) >= error
                        ? +data[i].toFixed(floatPrecision)
                        : rounded;
            }
        }
        return data;
    }
    function round(data) {
        for (var i = data.length; i-- > 0;) {
            data[i] = Math.round(data[i]);
        }
        return data;
    }
    var roundData = floatPrecision > 0 && floatPrecision < 20 ? strongRound : round;
    var g1Attrs = _path_1.getGroupAttrs(item);
    item.content.forEach(function (i) {
        if (i.isElem('group')) {
            var g2Attrs = _path_1.getGroupAttrs(i);
            var matrix = _path_1.flattenGroups([g1Attrs, g2Attrs]);
            var _a = _path_1.getScaling(matrix), sx = _a.sx, sy = _a.sy;
            var r = _path_1.getRotation(matrix).r;
            var _b = _path_1.getTranslation(matrix), tx = _b.tx, ty = _b.ty;
            var g3Attrs = { sx: sx, sy: sy, r: r, tx: tx, ty: ty };
            var addAttrFn = function (local, value) {
                i.addAttr({
                    name: "android:" + local,
                    prefix: 'android',
                    local: local,
                    value: String(value),
                });
            };
            addAttrFn('scaleX', sx);
            addAttrFn('scaleY', sy);
            addAttrFn('rotation', r);
            addAttrFn('translateX', tx);
            addAttrFn('translateY', ty);
        }
        else if (i.isElem('path') || i.isElem('clip-path')) {
            var data = _path_1.path2js(i);
            if (!data.length) {
                return;
            }
            _path_1.convertToRelative(data);
            data = _path_1.applyTransforms(item, i, data, params);
            data.forEach(function (d) {
                if (d.data) {
                    roundData(d.data);
                }
            });
            _path_1.js2path(i, data, {
                collapseRepeated: true,
                negativeExtraSpace: true,
                leadingZero: false,
            });
        }
    });
    removeGroupAttrs(item);
    return item;
}
function removeGroupAttrs(group) {
    group.removeAttr('android:pivotX');
    group.removeAttr('android:pivotY');
    group.removeAttr('android:scaleX');
    group.removeAttr('android:scaleY');
    group.removeAttr('android:translateX');
    group.removeAttr('android:translateY');
    group.removeAttr('android:rotation');
}
exports.bakeGroupTransforms = {
    type: 'perItem',
    active: true,
    description: 'merges group transforms towards the bottom of the tree',
    params: exports.defaultParams,
    fn: fn,
};
//# sourceMappingURL=bakeGroupTransforms.js.map