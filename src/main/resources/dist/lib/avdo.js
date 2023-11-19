"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bakeGroupTransforms_1 = require("../plugins/bakeGroupTransforms");
var collapseGroups_1 = require("../plugins/collapseGroups");
var convertPathData_1 = require("../plugins/convertPathData");
var js2xml_1 = require("./js2xml");
var mergePaths_1 = require("../plugins/mergePaths");
var _plugins_1 = require("../plugins/_plugins");
var removeComments_1 = require("../plugins/removeComments");
var removeDefaults_1 = require("../plugins/removeDefaults");
var removeEmptyGroups_1 = require("../plugins/removeEmptyGroups");
var removeHiddenElems_1 = require("../plugins/removeHiddenElems");
var removeXMLProcInst_1 = require("../plugins/removeXMLProcInst");
var xml2js_1 = require("./xml2js");
exports.plugins = {
    removeXMLProcInst: removeXMLProcInst_1.removeXMLProcInst,
    removeComments: removeComments_1.removeComments,
    removeDefaults: removeDefaults_1.removeDefaults,
    removeHiddenElems: removeHiddenElems_1.removeHiddenElems,
    bakeGroupTransforms: bakeGroupTransforms_1.bakeGroupTransforms,
    collapseGroups: collapseGroups_1.collapseGroups,
    convertPathData: convertPathData_1.convertPathData,
    removeEmptyGroups: removeEmptyGroups_1.removeEmptyGroups,
    mergePaths: mergePaths_1.mergePaths,
};
var batchedPlugins = (function (ps) {
    return ps.map(function (item) { return [item]; }).reduce(function (arr, item) {
        var last = arr[arr.length - 1];
        if (last && item[0].type === last[0].type) {
            last.push(item[0]);
        }
        else {
            arr.push(item);
        }
        return arr;
    }, []);
})(Object.keys(exports.plugins).map(function (k) { return exports.plugins[k]; }));
var Avdo = (function () {
    function Avdo(options) {
        if (options === void 0) { options = {
            plugins: batchedPlugins,
            multipass: true,
            pretty: true,
        }; }
        this.options = options;
    }
    Avdo.prototype.optimize = function (xml) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var maxPassCount = _this.options.multipass ? 10 : 1;
            var numPasses = 0;
            var prevResultSize = Number.POSITIVE_INFINITY;
            var onFail = function (error) { return reject(error); };
            var onSuccess = function (result) {
                numPasses++;
                if (numPasses < maxPassCount && result.length < prevResultSize) {
                    prevResultSize = result.length;
                    _this.optimizeOnce(result, onSuccess, onFail);
                }
                else {
                    resolve(result);
                }
            };
            _this.optimizeOnce(xml, onSuccess, onFail);
        });
    };
    Avdo.prototype.optimizeOnce = function (xml, onSuccess, onFail) {
        var _this = this;
        xml2js_1.xml2js(xml, function (jsApi) {
            jsApi = _plugins_1.processPlugins(jsApi, _this.options.plugins);
            onSuccess(js2xml_1.js2xml(jsApi, { pretty: _this.options.pretty }));
        }, function (error) { return onFail(error); });
    };
    return Avdo;
}());
exports.Avdo = Avdo;
//# sourceMappingURL=avdo.js.map