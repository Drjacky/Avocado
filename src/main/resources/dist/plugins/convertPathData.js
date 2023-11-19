"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _path_1 = require("./_path");
var _tools_1 = require("./_tools");
var roundData;
var precision;
var error;
var arcThreshold;
var arcTolerance;
exports.defaultParams = {
    applyTransforms: true,
    applyTransformsStroked: true,
    makeArcs: undefined,
    straightCurves: true,
    lineShorthands: true,
    curveSmoothShorthands: true,
    floatPrecision: 3,
    transformPrecision: 5,
    removeUseless: true,
    collapseRepeated: true,
    utilizeAbsolute: true,
    leadingZero: false,
    negativeExtraSpace: true,
};
function fn(item, params) {
    if (!(item.isElem('path') || item.isElem('clip-path')) ||
        item.hasAttr('android:name') ||
        !item.hasAttr('android:pathData')) {
        return item;
    }
    precision = params.floatPrecision;
    error = +Math.pow(0.1, precision).toFixed(precision);
    roundData = precision > 0 && precision < 20 ? strongRound : round;
    if (params.makeArcs) {
        arcThreshold = params.makeArcs.threshold;
        arcTolerance = params.makeArcs.tolerance;
    }
    var data = _path_1.path2js(item);
    if (!data.length) {
        return item;
    }
    _path_1.convertToRelative(data);
    data = filters(data, params);
    if (params.utilizeAbsolute) {
        data = convertToMixed(data, params);
    }
    _path_1.js2path(item, data, params);
    return item;
}
function filters(pathRes, params) {
    var stringify = data2Path.bind(undefined, params);
    var relSubpoint = [0, 0];
    var pathBase = [0, 0];
    var prev = {};
    pathRes = pathRes.filter(function (item, index, path) {
        var instruction = item.instruction;
        var data = item.data;
        var next = path[index + 1];
        if (data) {
            var sdata = data;
            var circle = void 0;
            if (instruction === 's') {
                sdata = [0, 0].concat(data);
                if ('cs'.indexOf(prev.instruction) > -1) {
                    var pdata = prev.data;
                    var n = pdata.length;
                    sdata[0] = pdata[n - 2] - pdata[n - 4];
                    sdata[1] = pdata[n - 1] - pdata[n - 3];
                }
            }
            if (params.makeArcs &&
                (instruction === 'c' || instruction === 's') &&
                isConvex(sdata) &&
                (circle = findCircle(sdata))) {
                var r = roundData([circle.radius])[0];
                var angle = findArcAngle(sdata, circle);
                var sweep = sdata[5] * sdata[0] - sdata[4] * sdata[1] > 0 ? 1 : 0;
                var arc = {
                    instruction: 'a',
                    data: [r, r, 0, 0, sweep, sdata[4], sdata[5]],
                    coords: item.coords.slice(),
                    base: item.base,
                };
                var output = [arc];
                var relCenter = [
                    circle.center[0] - sdata[4],
                    circle.center[1] - sdata[5],
                ];
                var relCircle = { center: relCenter, radius: circle.radius };
                var arcCurves = [item];
                var hasPrev = 0;
                var suffix = '';
                var nextLonghand = void 0;
                if ((prev.instruction === 'c' &&
                    isConvex(prev.data) &&
                    isArcPrev(prev.data, circle)) ||
                    (prev.instruction === 'a' &&
                        prev.sdata &&
                        isArcPrev(prev.sdata, circle))) {
                    arcCurves.unshift(prev);
                    arc.base = prev.base;
                    arc.data[5] = arc.coords[0] - arc.base[0];
                    arc.data[6] = arc.coords[1] - arc.base[1];
                    var prevData = prev.instruction === 'a' ? prev.sdata : prev.data;
                    angle += findArcAngle(prevData, {
                        center: [prevData[4] + relCenter[0], prevData[5] + relCenter[1]],
                        radius: circle.radius,
                    });
                    if (angle > Math.PI) {
                        arc.data[3] = 1;
                    }
                    hasPrev = 1;
                }
                var j = index;
                for (; (next = path[++j]) && ~'cs'.indexOf(next.instruction);) {
                    var nextDataTemp = next.data;
                    if (next.instruction === 's') {
                        nextLonghand = makeLonghand({ instruction: 's', data: next.data.slice() }, path[j - 1].data);
                        nextDataTemp = nextLonghand.data;
                        nextLonghand.data = nextDataTemp.slice(0, 2);
                        suffix = stringify([nextLonghand]);
                    }
                    var nextData = nextDataTemp;
                    if (isConvex(nextData) && isArc(nextData, relCircle)) {
                        angle += findArcAngle(nextData, relCircle);
                        if (angle - 2 * Math.PI > 1e-3) {
                            break;
                        }
                        if (angle > Math.PI) {
                            arc.data[3] = 1;
                        }
                        arcCurves.push(next);
                        if (2 * Math.PI - angle > 1e-3) {
                            arc.coords = next.coords;
                            arc.data[5] = arc.coords[0] - arc.base[0];
                            arc.data[6] = arc.coords[1] - arc.base[1];
                        }
                        else {
                            arc.data[5] = 2 * (relCircle.center[0] - nextData[4]);
                            arc.data[6] = 2 * (relCircle.center[1] - nextData[5]);
                            arc.coords = [
                                arc.base[0] + arc.data[5],
                                arc.base[1] + arc.data[6],
                            ];
                            arc = {
                                instruction: 'a',
                                data: [
                                    r,
                                    r,
                                    0,
                                    0,
                                    sweep,
                                    next.coords[0] - arc.coords[0],
                                    next.coords[1] - arc.coords[1],
                                ],
                                coords: next.coords,
                                base: arc.coords,
                            };
                            output.push(arc);
                            j++;
                            break;
                        }
                        relCenter[0] -= nextData[4];
                        relCenter[1] -= nextData[5];
                    }
                    else {
                        break;
                    }
                }
                if ((stringify(output) + suffix).length < stringify(arcCurves).length) {
                    if (path[j] && path[j].instruction === 's') {
                        makeLonghand(path[j], path[j - 1].data);
                    }
                    if (hasPrev) {
                        var prevArc = output.shift();
                        roundData(prevArc.data);
                        relSubpoint[0] += prevArc.data[5] - prev.data[prev.data.length - 2];
                        relSubpoint[1] += prevArc.data[6] - prev.data[prev.data.length - 1];
                        prev.instruction = 'a';
                        prev.data = prevArc.data;
                        item.base = prev.coords = prevArc.coords;
                    }
                    arc = output.shift();
                    if (arcCurves.length === 1) {
                        item.sdata = sdata.slice();
                    }
                    else if (arcCurves.length - 1 - hasPrev > 0) {
                        path.splice.apply(path, [
                            index + 1,
                            arcCurves.length - 1 - hasPrev
                        ].concat(output));
                    }
                    if (!arc) {
                        return false;
                    }
                    instruction = 'a';
                    data = arc.data;
                    item.coords = arc.coords;
                }
            }
            if ('mltqsc'.indexOf(instruction) > -1) {
                for (var i = data.length; i--;) {
                    data[i] += item.base[i % 2] - relSubpoint[i % 2];
                }
            }
            else if (instruction === 'h') {
                data[0] += item.base[0] - relSubpoint[0];
            }
            else if (instruction === 'v') {
                data[0] += item.base[1] - relSubpoint[1];
            }
            else if (instruction === 'a') {
                data[5] += item.base[0] - relSubpoint[0];
                data[6] += item.base[1] - relSubpoint[1];
            }
            roundData(data);
            if (instruction === 'h') {
                relSubpoint[0] += data[0];
            }
            else if (instruction === 'v') {
                relSubpoint[1] += data[0];
            }
            else {
                relSubpoint[0] += data[data.length - 2];
                relSubpoint[1] += data[data.length - 1];
            }
            roundData(relSubpoint);
            if (instruction.toLowerCase() === 'm') {
                pathBase[0] = relSubpoint[0];
                pathBase[1] = relSubpoint[1];
            }
            if (params.straightCurves) {
                if ((instruction === 'c' && isCurveStraightLine(data)) ||
                    (instruction === 's' && isCurveStraightLine(sdata))) {
                    if (next && next.instruction === 's') {
                        makeLonghand(next, data);
                    }
                    instruction = 'l';
                    data = data.slice(-2);
                }
                else if (instruction === 'q' && isCurveStraightLine(data)) {
                    if (next && next.instruction === 't') {
                        makeLonghand(next, data);
                    }
                    instruction = 'l';
                    data = data.slice(-2);
                }
                else if (instruction === 't' &&
                    prev.instruction !== 'q' &&
                    prev.instruction !== 't') {
                    instruction = 'l';
                    data = data.slice(-2);
                }
                else if (instruction === 'a' && (data[0] === 0 || data[1] === 0)) {
                    instruction = 'l';
                    data = data.slice(-2);
                }
            }
            if (params.lineShorthands && instruction === 'l') {
                if (data[1] === 0) {
                    instruction = 'h';
                    data.pop();
                }
                else if (data[0] === 0) {
                    instruction = 'v';
                    data.shift();
                }
            }
            if (params.collapseRepeated &&
                'mhv'.indexOf(instruction) > -1 &&
                prev.instruction &&
                instruction === prev.instruction.toLowerCase() &&
                ((instruction !== 'h' && instruction !== 'v') ||
                    prev.data[0] >= 0 === item.data[0] >= 0)) {
                prev.data[0] += data[0];
                if (instruction !== 'h' && instruction !== 'v') {
                    prev.data[1] += data[1];
                }
                prev.coords = item.coords;
                path[index] = prev;
                return false;
            }
            if (params.curveSmoothShorthands && prev.instruction) {
                if (instruction === 'c') {
                    if (prev.instruction === 'c' &&
                        data[0] === -(prev.data[2] - prev.data[4]) &&
                        data[1] === -(prev.data[3] - prev.data[5])) {
                        instruction = 's';
                        data = data.slice(2);
                    }
                    else if (prev.instruction === 's' &&
                        data[0] === -(prev.data[0] - prev.data[2]) &&
                        data[1] === -(prev.data[1] - prev.data[3])) {
                        instruction = 's';
                        data = data.slice(2);
                    }
                    else if ('cs'.indexOf(prev.instruction) === -1 &&
                        data[0] === 0 &&
                        data[1] === 0) {
                        instruction = 's';
                        data = data.slice(2);
                    }
                }
                else if (instruction === 'q') {
                    if (prev.instruction === 'q' &&
                        data[0] === prev.data[2] - prev.data[0] &&
                        data[1] === prev.data[3] - prev.data[1]) {
                        instruction = 't';
                        data = data.slice(2);
                    }
                    else if (prev.instruction === 't' &&
                        data[2] === prev.data[0] &&
                        data[3] === prev.data[1]) {
                        instruction = 't';
                        data = data.slice(2);
                    }
                }
            }
            if (params.removeUseless) {
                if ('lhvqtcs'.indexOf(instruction) > -1 && data.every(function (i) { return i === 0; })) {
                    path[index] = prev;
                    return false;
                }
                if (instruction === 'a' && data[5] === 0 && data[6] === 0) {
                    path[index] = prev;
                    return false;
                }
            }
            item.instruction = instruction;
            item.data = data;
            prev = item;
        }
        else {
            relSubpoint[0] = pathBase[0];
            relSubpoint[1] = pathBase[1];
            if (prev.instruction === 'z') {
                return false;
            }
            prev = item;
        }
        return true;
    });
    return pathRes;
}
function convertToMixed(path, params) {
    var prev = path[0];
    path = path.filter(function (item, index) {
        if (index === 0) {
            return true;
        }
        if (!item.data) {
            prev = item;
            return true;
        }
        var instruction = item.instruction;
        var data = item.data;
        var adata = data && data.slice(0);
        if ('mltqsc'.indexOf(instruction) > -1) {
            for (var i = adata.length; i--;) {
                adata[i] += item.base[i % 2];
            }
        }
        else if (instruction === 'h') {
            adata[0] += item.base[0];
        }
        else if (instruction === 'v') {
            adata[0] += item.base[1];
        }
        else if (instruction === 'a') {
            adata[5] += item.base[0];
            adata[6] += item.base[1];
        }
        roundData(adata);
        var absoluteDataStr = _tools_1.cleanupOutData(adata, params);
        var relativeDataStr = _tools_1.cleanupOutData(data, params);
        if (absoluteDataStr.length < relativeDataStr.length &&
            !(params.negativeExtraSpace &&
                instruction === prev.instruction &&
                prev.instruction.charCodeAt(0) > 96 &&
                absoluteDataStr.length === relativeDataStr.length - 1 &&
                (data[0] < 0 ||
                    (/^0\./.test(String(data[0])) && prev.data[prev.data.length - 1] % 1)))) {
            item.instruction = instruction.toUpperCase();
            item.data = adata;
        }
        prev = item;
        return true;
    });
    return path;
}
function isConvex(data) {
    var center = getIntersection([
        0,
        0,
        data[2],
        data[3],
        data[0],
        data[1],
        data[4],
        data[5],
    ]);
    return (center &&
        data[2] < center[0] === center[0] < 0 &&
        data[3] < center[1] === center[1] < 0 &&
        data[4] < center[0] === center[0] < data[0] &&
        data[5] < center[1] === center[1] < data[1]);
}
function getIntersection(coords) {
    var a1 = coords[1] - coords[3];
    var b1 = coords[2] - coords[0];
    var c1 = coords[0] * coords[3] - coords[2] * coords[1];
    var a2 = coords[5] - coords[7];
    var b2 = coords[6] - coords[4];
    var c2 = coords[4] * coords[7] - coords[5] * coords[6];
    var denom = a1 * b2 - a2 * b1;
    if (!denom) {
        return undefined;
    }
    var cross = [
        (b1 * c2 - b2 * c1) / denom,
        (a1 * c2 - a2 * c1) / -denom,
    ];
    if (!isNaN(cross[0]) &&
        !isNaN(cross[1]) &&
        isFinite(cross[0]) &&
        isFinite(cross[1])) {
        return cross;
    }
    return undefined;
}
function strongRound(data) {
    for (var i = data.length; i-- > 0;) {
        if (+data[i].toFixed(precision) !== data[i]) {
            var rounded = +data[i].toFixed(precision - 1);
            data[i] =
                +Math.abs(rounded - data[i]).toFixed(precision + 1) >= error
                    ? +data[i].toFixed(precision)
                    : rounded;
        }
    }
    return data;
}
function isCurveStraightLine(data) {
    var i = data.length - 2;
    var a = -data[i + 1];
    var b = data[i];
    var d = 1 / (a * a + b * b);
    if (i <= 1 || !isFinite(d)) {
        return false;
    }
    while ((i -= 2) >= 0) {
        if (Math.sqrt(Math.pow(a * data[i] + b * data[i + 1], 2) * d) > error) {
            return false;
        }
    }
    return true;
}
function makeLonghand(item, data) {
    switch (item.instruction) {
        case 's':
            item.instruction = 'c';
            break;
        case 't':
            item.instruction = 'q';
            break;
    }
    item.data.unshift(data[data.length - 2] - data[data.length - 4], data[data.length - 1] - data[data.length - 3]);
    return item;
}
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}
function getCubicBezierPoint(curve, t) {
    var sqrT = t * t;
    var cubT = sqrT * t;
    var mt = 1 - t;
    var sqrMt = mt * mt;
    return [
        3 * sqrMt * t * curve[0] + 3 * mt * sqrT * curve[2] + cubT * curve[4],
        3 * sqrMt * t * curve[1] + 3 * mt * sqrT * curve[3] + cubT * curve[5],
    ];
}
function findCircle(curve) {
    var midPoint = getCubicBezierPoint(curve, 1 / 2);
    var m1 = [midPoint[0] / 2, midPoint[1] / 2];
    var m2 = [(midPoint[0] + curve[4]) / 2, (midPoint[1] + curve[5]) / 2];
    var center = getIntersection([
        m1[0],
        m1[1],
        m1[0] + m1[1],
        m1[1] - m1[0],
        m2[0],
        m2[1],
        m2[0] + (m2[1] - midPoint[1]),
        m2[1] - (m2[0] - midPoint[0]),
    ]);
    var radius = center && getDistance([0, 0], center);
    var tolerance = Math.min(arcThreshold * error, arcTolerance * radius / 100);
    if (center &&
        [1 / 4, 3 / 4].every(function (point) {
            return (Math.abs(getDistance(getCubicBezierPoint(curve, point), center) - radius) <= tolerance);
        })) {
        return { center: center, radius: radius };
    }
    return undefined;
}
function isArc(curve, circle) {
    var tolerance = Math.min(arcThreshold * error, arcTolerance * circle.radius / 100);
    return [0, 1 / 4, 1 / 2, 3 / 4, 1].every(function (point) {
        return (Math.abs(getDistance(getCubicBezierPoint(curve, point), circle.center) -
            circle.radius) <= tolerance);
    });
}
function isArcPrev(curve, circle) {
    return isArc(curve, {
        center: [circle.center[0] + curve[4], circle.center[1] + curve[5]],
        radius: circle.radius,
    });
}
function findArcAngle(curve, relCircle) {
    var x1 = -relCircle.center[0];
    var y1 = -relCircle.center[1];
    var x2 = curve[4] - relCircle.center[0];
    var y2 = curve[5] - relCircle.center[1];
    return Math.acos((x1 * x2 + y1 * y2) / Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)));
}
function data2Path(params, pathData) {
    return pathData.reduce(function (pathString, item) {
        return (pathString +
            item.instruction +
            (item.data ? _tools_1.cleanupOutData(roundData(item.data.slice()), params) : ''));
    }, '');
}
function round(data) {
    for (var i = data.length; i-- > 0;) {
        data[i] = Math.round(data[i]);
    }
    return data;
}
exports.convertPathData = {
    type: 'perItem',
    active: true,
    description: 'optimizes path data: writes in shorter form, applies transformations',
    params: exports.defaultParams,
    fn: fn,
};
//# sourceMappingURL=convertPathData.js.map