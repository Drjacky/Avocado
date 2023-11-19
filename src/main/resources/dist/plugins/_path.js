"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _collections = require("./_collections");
var _tools = require("./_tools");
var regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/;
var regPathData = /[-+]?(?:\d*\.\d+|\d+\.?)([eE][-+]?\d+)?/g;
var regNumericValues = /[-+]?(\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/;
var referencesProps = _collections.referencesProps;
var defaultStrokeWidth = _collections.attrsGroupsDefaults.presentation['stroke-width'];
var cleanupOutData = _tools.cleanupOutData;
var removeLeadingZero = _tools.removeLeadingZero;
var prevCtrlPoint;
function path2js(path) {
    if (path.pathJS) {
        return path.pathJS;
    }
    var paramsLength = {
        H: 1, V: 1, M: 2, L: 2, T: 2, Q: 4, S: 4, C: 6, A: 7,
        h: 1, v: 1, m: 2, l: 2, t: 2, q: 4, s: 4, c: 6, a: 7,
    };
    var pathData = [];
    var instruction;
    var startMoveto = false;
    path
        .attr('android:pathData')
        .value.split(regPathInstructions)
        .forEach(function (data) {
        if (!data) {
            return;
        }
        if (!startMoveto) {
            if (data === 'M' || data === 'm') {
                startMoveto = true;
            }
            else {
                return;
            }
        }
        if (regPathInstructions.test(data)) {
            instruction = data;
            if (instruction === 'Z' || instruction === 'z') {
                pathData.push({ instruction: 'z' });
            }
        }
        else {
            var matchedData = data.match(regPathData);
            if (!matchedData) {
                return;
            }
            var matchedNumData = matchedData.map(Number);
            if (instruction === 'M' || instruction === 'm') {
                pathData.push({
                    instruction: pathData.length === 0 ? 'M' : instruction,
                    data: matchedNumData.splice(0, 2),
                });
                instruction = instruction === 'M' ? 'L' : 'l';
            }
            for (var pair = paramsLength[instruction]; matchedNumData.length;) {
                pathData.push({ instruction: instruction, data: matchedNumData.splice(0, pair) });
            }
        }
    });
    if (pathData.length && pathData[0].instruction === 'm') {
        pathData[0].instruction = 'M';
    }
    path.pathJS = pathData;
    return pathData;
}
exports.path2js = path2js;
function convertToRelative(path) {
    var point = [0, 0];
    var subpathPoint = [0, 0];
    var baseItem;
    path.forEach(function (item, index) {
        var instruction = item.instruction;
        var data = item.data;
        if (data) {
            if ('mcslqta'.indexOf(instruction) > -1) {
                point[0] += data[data.length - 2];
                point[1] += data[data.length - 1];
                if (instruction === 'm') {
                    subpathPoint[0] = point[0];
                    subpathPoint[1] = point[1];
                    baseItem = item;
                }
            }
            else if (instruction === 'h') {
                point[0] += data[0];
            }
            else if (instruction === 'v') {
                point[1] += data[0];
            }
            if (instruction === 'M') {
                if (index > 0) {
                    instruction = 'm';
                }
                data[0] -= point[0];
                data[1] -= point[1];
                subpathPoint[0] = point[0] += data[0];
                subpathPoint[1] = point[1] += data[1];
                baseItem = item;
            }
            else if ('LT'.indexOf(instruction) > -1) {
                instruction = instruction.toLowerCase();
                data[0] -= point[0];
                data[1] -= point[1];
                point[0] += data[0];
                point[1] += data[1];
            }
            else if (instruction === 'C') {
                instruction = 'c';
                data[0] -= point[0];
                data[1] -= point[1];
                data[2] -= point[0];
                data[3] -= point[1];
                data[4] -= point[0];
                data[5] -= point[1];
                point[0] += data[4];
                point[1] += data[5];
            }
            else if ('SQ'.indexOf(instruction) > -1) {
                instruction = instruction.toLowerCase();
                data[0] -= point[0];
                data[1] -= point[1];
                data[2] -= point[0];
                data[3] -= point[1];
                point[0] += data[2];
                point[1] += data[3];
            }
            else if (instruction === 'A') {
                instruction = 'a';
                data[5] -= point[0];
                data[6] -= point[1];
                point[0] += data[5];
                point[1] += data[6];
            }
            else if (instruction === 'H') {
                instruction = 'h';
                data[0] -= point[0];
                point[0] += data[0];
            }
            else if (instruction === 'V') {
                instruction = 'v';
                data[0] -= point[1];
                point[1] += data[0];
            }
            item.instruction = instruction;
            item.data = data;
            item.coords = point.slice(-2);
        }
        else if (instruction === 'z') {
            if (baseItem) {
                item.coords = baseItem.coords;
            }
            point[0] = subpathPoint[0];
            point[1] = subpathPoint[1];
        }
        item.base = index > 0 ? path[index - 1].coords : [0, 0];
    });
    return path;
}
exports.convertToRelative = convertToRelative;
function relative2absolute(data) {
    var currentPoint = [0, 0];
    var subpathPoint = [0, 0];
    return data.map(function (item) {
        var instruction = item.instruction;
        var itemData = item.data && item.data.slice();
        if (instruction === 'M') {
            set(currentPoint, itemData);
            set(subpathPoint, itemData);
        }
        else if ('mlcsqt'.indexOf(instruction) > -1) {
            for (var i = 0; i < itemData.length; i++) {
                itemData[i] += currentPoint[i % 2];
            }
            set(currentPoint, itemData);
            if (instruction === 'm') {
                set(subpathPoint, itemData);
            }
        }
        else if (instruction === 'a') {
            itemData[5] += currentPoint[0];
            itemData[6] += currentPoint[1];
            set(currentPoint, itemData);
        }
        else if (instruction === 'h') {
            itemData[0] += currentPoint[0];
            currentPoint[0] = itemData[0];
        }
        else if (instruction === 'v') {
            itemData[0] += currentPoint[1];
            currentPoint[1] = itemData[0];
        }
        else if ('MZLCSQTA'.indexOf(instruction) > -1) {
            set(currentPoint, itemData);
        }
        else if (instruction === 'H') {
            currentPoint[0] = itemData[0];
        }
        else if (instruction === 'V') {
            currentPoint[1] = itemData[0];
        }
        else if (instruction === 'z') {
            set(currentPoint, subpathPoint);
        }
        return instruction === 'z'
            ? { instruction: 'z' }
            : {
                instruction: instruction.toUpperCase(),
                data: itemData,
            };
    });
}
function applyTransforms(group, elem, path, params) {
    var groupAttrs = getGroupAttrs(group);
    var matrix = {
        name: 'matrix',
        data: groupToMatrix(groupAttrs),
    };
    var transformPrecision = params.transformPrecision;
    var newPoint;
    path.forEach(function (pathItem) {
        if (pathItem.data) {
            if (pathItem.instruction === 'h') {
                pathItem.instruction = 'l';
                pathItem.data[1] = 0;
            }
            else if (pathItem.instruction === 'v') {
                pathItem.instruction = 'l';
                pathItem.data[1] = pathItem.data[0];
                pathItem.data[0] = 0;
            }
            if (pathItem.instruction === 'M' &&
                (matrix.data[4] !== 0 || matrix.data[5] !== 0)) {
                newPoint = transformPoint(matrix.data, pathItem.data[0], pathItem.data[1]);
                set(pathItem.data, newPoint);
                set(pathItem.coords, newPoint);
                matrix.data[4] = 0;
                matrix.data[5] = 0;
            }
            else {
                if (pathItem.instruction === 'a') {
                    transformArc(pathItem.data, matrix.data);
                    if (Math.abs(pathItem.data[2]) > 80) {
                        var a = pathItem.data[0];
                        var rotation = pathItem.data[2];
                        pathItem.data[0] = pathItem.data[1];
                        pathItem.data[1] = a;
                        pathItem.data[2] = rotation + (rotation > 0 ? -90 : 90);
                    }
                    newPoint = transformPoint(matrix.data, pathItem.data[5], pathItem.data[6]);
                    pathItem.data[5] = newPoint[0];
                    pathItem.data[6] = newPoint[1];
                }
                else {
                    for (var i = 0; i < pathItem.data.length; i += 2) {
                        newPoint = transformPoint(matrix.data, pathItem.data[i], pathItem.data[i + 1]);
                        pathItem.data[i] = newPoint[0];
                        pathItem.data[i + 1] = newPoint[1];
                    }
                }
                pathItem.coords[0] =
                    pathItem.base[0] + pathItem.data[pathItem.data.length - 2];
                pathItem.coords[1] =
                    pathItem.base[1] + pathItem.data[pathItem.data.length - 1];
            }
        }
    });
    return path;
}
exports.applyTransforms = applyTransforms;
function getGroupAttrs(group) {
    var px = getGroupAttr(group, 'pivotX', 0);
    var py = getGroupAttr(group, 'pivotY', 0);
    var sx = getGroupAttr(group, 'scaleX', 1);
    var sy = getGroupAttr(group, 'scaleY', 1);
    var tx = getGroupAttr(group, 'translateX', 0);
    var ty = getGroupAttr(group, 'translateY', 0);
    var r = getGroupAttr(group, 'rotation', 0);
    return { px: px, py: py, sx: sx, sy: sy, tx: tx, ty: ty, r: r };
}
exports.getGroupAttrs = getGroupAttrs;
function getGroupAttr(group, attrLocalName, defaultValue) {
    var attrName = "android:" + attrLocalName;
    var result = group.hasAttr(attrName)
        ? +group.attr(attrName).value
        : defaultValue;
    return result;
}
function getScaling(matrix) {
    var a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3];
    var sx = (a >= 0 ? 1 : -1) * Math.hypot(a, c);
    var sy = (d >= 0 ? 1 : -1) * Math.hypot(b, d);
    return { sx: sx, sy: sy };
}
exports.getScaling = getScaling;
function getRotation(matrix) {
    return { r: 180 / Math.PI * Math.atan2(-matrix[2], matrix[0]) };
}
exports.getRotation = getRotation;
function getTranslation(matrix) {
    return { tx: matrix[4], ty: matrix[5] };
}
exports.getTranslation = getTranslation;
function flattenMatrices() {
    var matrices = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        matrices[_i] = arguments[_i];
    }
    var identity = [1, 0, 0, 1, 0, 0];
    return matrices.reduce(function (m1, m2) {
        return [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
        ];
    }, identity);
}
function groupToMatrix(_a) {
    var sx = _a.sx, sy = _a.sy, r = _a.r, tx = _a.tx, ty = _a.ty, px = _a.px, py = _a.py;
    var cosr = Math.cos(r * Math.PI / 180);
    var sinr = Math.sin(r * Math.PI / 180);
    return flattenMatrices([1, 0, 0, 1, px, py], [1, 0, 0, 1, tx, ty], [cosr, sinr, -sinr, cosr, 0, 0], [sx, 0, 0, sy, 0, 0], [1, 0, 0, 1, -px, -py]);
}
function flattenGroups(groups) {
    return flattenMatrices.apply(void 0, groups.map(groupToMatrix));
}
exports.flattenGroups = flattenGroups;
function transformPoint(matrix, x, y) {
    return [
        matrix[0] * x + matrix[2] * y + matrix[4],
        matrix[1] * x + matrix[3] * y + matrix[5],
    ];
}
function js2path(path, data, params) {
    path.pathJS = data;
    if (params.collapseRepeated) {
        data = collapseRepeated(data);
    }
    path.attr('android:pathData').value = data.reduce(function (pathString, item) {
        return (pathString +=
            item.instruction + (item.data ? cleanupOutData(item.data, params) : ''));
    }, '');
}
exports.js2path = js2path;
function collapseRepeated(data) {
    var prev;
    var prevIndex;
    return data.reduce(function (newPath, item) {
        if (prev && item.data && item.instruction === prev.instruction) {
            if (item.instruction !== 'M') {
                prev = newPath[prevIndex] = {
                    instruction: prev.instruction,
                    data: prev.data.concat(item.data),
                    coords: item.coords,
                    base: prev.base,
                };
            }
            else {
                prev.data = item.data;
                prev.coords = item.coords;
            }
        }
        else {
            newPath.push(item);
            prev = item;
            prevIndex = newPath.length - 1;
        }
        return newPath;
    }, []);
}
function set(dest, source) {
    dest[0] = source[source.length - 2];
    dest[1] = source[source.length - 1];
    return dest;
}
function intersects(path1, path2) {
    if (path1.length < 3 || path2.length < 3) {
        return false;
    }
    var points1 = relative2absolute(path1).reduce(gatherPoints, []);
    var points2 = relative2absolute(path2).reduce(gatherPoints, []);
    if (points1.maxX <= points2.minX ||
        points2.maxX <= points1.minX ||
        points1.maxY <= points2.minY ||
        points2.maxY <= points1.minY ||
        points1.every(function (set1) {
            return points2.every(function (set2) {
                return (set1[set1.maxX][0] <= set2[set2.minX][0] ||
                    set2[set2.maxX][0] <= set1[set1.minX][0] ||
                    set1[set1.maxY][1] <= set2[set2.minY][1] ||
                    set2[set2.maxY][1] <= set1[set1.minY][1]);
            });
        })) {
        return false;
    }
    var hullNest1 = points1.map(convexHull);
    var hullNest2 = points2.map(convexHull);
    return hullNest1.some(function (hull1) {
        if (hull1.length < 3) {
            return false;
        }
        return hullNest2.some(function (hull2) {
            if (hull2.length < 3) {
                return false;
            }
            var simplex = [getSupport(hull1, hull2, [1, 0])];
            var direction = minus(simplex[0]);
            var iterations = 1e4;
            while (true) {
                if (iterations-- === 0) {
                    console.error('Error: infinite loop while processing mergePaths plugin.');
                    return true;
                }
                simplex.push(getSupport(hull1, hull2, direction));
                if (dot(direction, simplex[simplex.length - 1]) <= 0) {
                    return false;
                }
                if (processSimplex(simplex, direction)) {
                    return true;
                }
            }
        });
    });
    function getSupport(a, b, direction) {
        return sub(supportPoint(a, direction), supportPoint(b, minus(direction)));
    }
    function supportPoint(polygon, direction) {
        var index = direction[1] >= 0
            ? direction[0] < 0 ? polygon.maxY : polygon.maxX
            : direction[0] < 0 ? polygon.minX : polygon.minY;
        var max = -Infinity;
        var value;
        while ((value = dot(polygon[index], direction)) > max) {
            max = value;
            index = ++index % polygon.length;
        }
        return polygon[(index || polygon.length) - 1];
    }
}
exports.intersects = intersects;
function processSimplex(simplex, direction) {
    if (simplex.length === 2) {
        var a = simplex[1];
        var b = simplex[0];
        var AO = minus(simplex[1]);
        var AB = sub(b, a);
        if (dot(AO, AB) > 0) {
            set(direction, orth(AB, a));
        }
        else {
            set(direction, AO);
            simplex.shift();
        }
    }
    else {
        var a = simplex[2];
        var b = simplex[1];
        var c = simplex[0];
        var AB = sub(b, a);
        var AC = sub(c, a);
        var AO = minus(a);
        var ACB = orth(AB, AC);
        var ABC = orth(AC, AB);
        if (dot(ACB, AO) > 0) {
            if (dot(AB, AO) > 0) {
                set(direction, ACB);
                simplex.shift();
            }
            else {
                set(direction, AO);
                simplex.splice(0, 2);
            }
        }
        else if (dot(ABC, AO) > 0) {
            if (dot(AC, AO) > 0) {
                set(direction, ABC);
                simplex.splice(1, 1);
            }
            else {
                set(direction, AO);
                simplex.splice(0, 2);
            }
        }
        else {
            return true;
        }
    }
    return false;
}
function minus(v) {
    return [-v[0], -v[1]];
}
function sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}
function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
}
function orth(v, from) {
    var o = [-v[1], v[0]];
    return dot(o, minus(from)) < 0 ? minus(o) : o;
}
function gatherPoints(points, item, index, path) {
    var subPath = points.length && points[points.length - 1];
    var prev = index && path[index - 1];
    var basePoint = subPath.length && subPath[subPath.length - 1];
    var data = item.data;
    var ctrlPoint = basePoint;
    switch (item.instruction) {
        case 'M':
            points.push((subPath = []));
            break;
        case 'H':
            addPoint(subPath, [data[0], basePoint[1]]);
            break;
        case 'V':
            addPoint(subPath, [basePoint[0], data[0]]);
            break;
        case 'Q':
            addPoint(subPath, data.slice(0, 2));
            prevCtrlPoint = [data[2] - data[0], data[3] - data[1]];
            break;
        case 'T':
            if (prev.instruction === 'Q' || prev.instruction === 'T') {
                ctrlPoint = [
                    basePoint[0] + prevCtrlPoint[0],
                    basePoint[1] + prevCtrlPoint[1],
                ];
                addPoint(subPath, ctrlPoint);
                prevCtrlPoint = [data[0] - ctrlPoint[0], data[1] - ctrlPoint[1]];
            }
            break;
        case 'C':
            addPoint(subPath, [
                0.5 * (basePoint[0] + data[0]),
                0.5 * (basePoint[1] + data[1]),
            ]);
            addPoint(subPath, [0.5 * (data[0] + data[2]), 0.5 * (data[1] + data[3])]);
            addPoint(subPath, [0.5 * (data[2] + data[4]), 0.5 * (data[3] + data[5])]);
            prevCtrlPoint = [data[4] - data[2], data[5] - data[3]];
            break;
        case 'S':
            if (prev.instruction === 'C' || prev.instruction === 'S') {
                addPoint(subPath, [
                    basePoint[0] + 0.5 * prevCtrlPoint[0],
                    basePoint[1] + 0.5 * prevCtrlPoint[1],
                ]);
                ctrlPoint = [
                    basePoint[0] + prevCtrlPoint[0],
                    basePoint[1] + prevCtrlPoint[1],
                ];
            }
            addPoint(subPath, [
                0.5 * (ctrlPoint[0] + data[0]),
                0.5 * (ctrlPoint[1] + data[1]),
            ]);
            addPoint(subPath, [0.5 * (data[0] + data[2]), 0.5 * (data[1] + data[3])]);
            prevCtrlPoint = [data[2] - data[0], data[3] - data[1]];
            break;
        case 'A':
            var curves = a2c.apply(0, basePoint.concat(data));
            for (var cData = void 0; (cData = curves.splice(0, 6).map(toAbsolute)).length;) {
                addPoint(subPath, [
                    0.5 * (basePoint[0] + cData[0]),
                    0.5 * (basePoint[1] + cData[1]),
                ]);
                addPoint(subPath, [
                    0.5 * (cData[0] + cData[2]),
                    0.5 * (cData[1] + cData[3]),
                ]);
                addPoint(subPath, [
                    0.5 * (cData[2] + cData[4]),
                    0.5 * (cData[3] + cData[5]),
                ]);
                if (curves.length) {
                    addPoint(subPath, (basePoint = cData.slice(-2)));
                }
            }
            break;
    }
    if (data && data.length >= 2) {
        addPoint(subPath, data.slice(-2));
    }
    return points;
    function toAbsolute(n, i) {
        return n + basePoint[i % 2];
    }
    function addPoint(p, point) {
        if (!p.length || point[1] > p[p.maxY][1]) {
            p.maxY = p.length;
            points.maxY = points.length ? Math.max(point[1], points.maxY) : point[1];
        }
        if (!p.length || point[0] > p[p.maxX][0]) {
            p.maxX = p.length;
            points.maxX = points.length ? Math.max(point[0], points.maxX) : point[0];
        }
        if (!p.length || point[1] < p[p.minY][1]) {
            p.minY = p.length;
            points.minY = points.length ? Math.min(point[1], points.minY) : point[1];
        }
        if (!p.length || point[0] < p[p.minX][0]) {
            p.minX = p.length;
            points.minX = points.length ? Math.min(point[0], points.minX) : point[0];
        }
        p.push(point);
    }
}
function convexHull(points) {
    points.sort(function (a, b) { return (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]); });
    var lower = [];
    var minY = 0;
    var bottom = 0;
    for (var i = 0; i < points.length; i++) {
        while (lower.length >= 2 &&
            cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
            lower.pop();
        }
        if (points[i][1] < points[minY][1]) {
            minY = i;
            bottom = lower.length;
        }
        lower.push(points[i]);
    }
    var upper = [];
    var maxY = points.length - 1;
    var top = 0;
    for (var i = points.length; i--;) {
        while (upper.length >= 2 &&
            cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
            upper.pop();
        }
        if (points[i][1] > points[maxY][1]) {
            maxY = i;
            top = upper.length;
        }
        upper.push(points[i]);
    }
    upper.pop();
    lower.pop();
    var hull = lower.concat(upper);
    hull.minX = 0;
    hull.maxX = lower.length;
    hull.minY = bottom;
    hull.maxY = (lower.length + top) % hull.length;
    return hull;
}
function cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
    var _120 = Math.PI * 120 / 180;
    var rad = Math.PI / 180 * (+angle || 0);
    var res = [];
    var rotateX = function (x, y, r) {
        return x * Math.cos(r) - y * Math.sin(r);
    };
    var rotateY = function (x, y, r) {
        return x * Math.sin(r) + y * Math.cos(r);
    };
    var f1;
    var f2;
    var cx;
    var cy;
    if (!recursive) {
        x1 = rotateX(x1, y1, -rad);
        y1 = rotateY(x1, y1, -rad);
        x2 = rotateX(x2, y2, -rad);
        y2 = rotateY(x2, y2, -rad);
        var x = (x1 - x2) / 2;
        var y = (y1 - y2) / 2;
        var h = x * x / (rx * rx) + y * y / (ry * ry);
        if (h > 1) {
            h = Math.sqrt(h);
            rx = h * rx;
            ry = h * ry;
        }
        var rx2 = rx * rx;
        var ry2 = ry * ry;
        var k = (large_arc_flag === sweep_flag ? -1 : 1) *
            Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)));
        cx = k * rx * y / ry + (x1 + x2) / 2;
        cy = k * -ry * x / rx + (y1 + y2) / 2;
        f1 = Math.asin(+((y1 - cy) / ry).toFixed(9));
        f2 = Math.asin(+((y2 - cy) / ry).toFixed(9));
        f1 = x1 < cx ? Math.PI - f1 : f1;
        f2 = x2 < cx ? Math.PI - f2 : f2;
        if (f1 < 0) {
            f1 = Math.PI * 2 + f1;
        }
        if (f2 < 0) {
            f2 = Math.PI * 2 + f2;
        }
        if (sweep_flag && f1 > f2) {
            f1 = f1 - Math.PI * 2;
        }
        if (!sweep_flag && f2 > f1) {
            f2 = f2 - Math.PI * 2;
        }
    }
    else {
        f1 = recursive[0];
        f2 = recursive[1];
        cx = recursive[2];
        cy = recursive[3];
    }
    var df = f2 - f1;
    if (Math.abs(df) > _120) {
        var f2old = f2;
        var x2old = x2;
        var y2old = y2;
        f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
        x2 = cx + rx * Math.cos(f2);
        y2 = cy + ry * Math.sin(f2);
        res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [
            f2,
            f2old,
            cx,
            cy,
        ]);
    }
    df = f2 - f1;
    var c1 = Math.cos(f1);
    var s1 = Math.sin(f1);
    var c2 = Math.cos(f2);
    var s2 = Math.sin(f2);
    var t = Math.tan(df / 4);
    var hx = 4 / 3 * rx * t;
    var hy = 4 / 3 * ry * t;
    var m = [
        -hx * s1,
        hy * c1,
        x2 + hx * s2 - x1,
        y2 - hy * c2 - y1,
        x2 - x1,
        y2 - y1,
    ];
    if (recursive) {
        return m.concat(res);
    }
    else {
        res = m.concat(res);
        var newRes = [];
        for (var i = 0, n = res.length; i < n; i++) {
            newRes[i] =
                i % 2
                    ? rotateY(res[i - 1], res[i], rad)
                    : rotateX(res[i], res[i + 1], rad);
        }
        return newRes;
    }
}
function transformArc(arc, transform) {
    var a = arc[0];
    var b = arc[1];
    var rot = arc[2] * Math.PI / 180;
    var cos = Math.cos(rot);
    var sin = Math.sin(rot);
    var h = Math.pow(arc[5] * cos + arc[6] * sin, 2) / (4 * a * a) +
        Math.pow(arc[6] * cos - arc[5] * sin, 2) / (4 * b * b);
    if (h > 1) {
        h = Math.sqrt(h);
        a *= h;
        b *= h;
    }
    var ellipse = [a * cos, a * sin, -b * sin, b * cos, 0, 0];
    var m = flattenMatrices(transform, ellipse);
    var lastCol = m[2] * m[2] + m[3] * m[3];
    var squareSum = m[0] * m[0] + m[1] * m[1] + lastCol;
    var root = Math.sqrt((Math.pow(m[0] - m[3], 2) + Math.pow(m[1] + m[2], 2)) *
        (Math.pow(m[0] + m[3], 2) + Math.pow(m[1] - m[2], 2)));
    if (!root) {
        arc[0] = arc[1] = Math.sqrt(squareSum / 2);
        arc[2] = 0;
    }
    else {
        var majorAxisSqr = (squareSum + root) / 2;
        var minorAxisSqr = (squareSum - root) / 2;
        var major = Math.abs(majorAxisSqr - lastCol) > 1e-6;
        var s = (major ? majorAxisSqr : minorAxisSqr) - lastCol;
        var rowsSum = m[0] * m[2] + m[1] * m[3];
        var term1 = m[0] * s + m[2] * rowsSum;
        var term2 = m[1] * s + m[3] * rowsSum;
        arc[0] = Math.sqrt(majorAxisSqr);
        arc[1] = Math.sqrt(minorAxisSqr);
        arc[2] =
            ((major ? term2 < 0 : term1 > 0) ? -1 : 1) *
                Math.acos((major ? term1 : term2) / Math.sqrt(term1 * term1 + term2 * term2)) *
                180 /
                Math.PI;
    }
    if (transform[0] < 0 !== transform[3] < 0) {
        arc[4] = 1 - arc[4];
    }
    return arc;
}
//# sourceMappingURL=_path.js.map