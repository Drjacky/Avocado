"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function cleanupOutData(data, params) {
    var str = '';
    var delimiter;
    var prev;
    data.forEach(function (item, i) {
        delimiter = ' ';
        if (i === 0) {
            delimiter = '';
        }
        var itemStr = item;
        if (params.leadingZero) {
            itemStr = removeLeadingZero(item);
        }
        if (params.negativeExtraSpace &&
            (itemStr < 0 || (String(itemStr).charCodeAt(0) === 46 && +prev % 1 !== 0))) {
            delimiter = '';
        }
        prev = itemStr;
        str += delimiter + itemStr;
    });
    return str;
}
exports.cleanupOutData = cleanupOutData;
function removeLeadingZero(num) {
    var strNum = num.toString();
    if (0 < num && num < 1 && strNum.charCodeAt(0) === 48) {
        strNum = strNum.slice(1);
    }
    else if (-1 < num && num < 0 && strNum.charCodeAt(1) === 48) {
        strNum = strNum.charAt(0) + strNum.slice(2);
    }
    return strNum;
}
exports.removeLeadingZero = removeLeadingZero;
//# sourceMappingURL=_tools.js.map