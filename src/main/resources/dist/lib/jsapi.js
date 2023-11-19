"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JsApi = (function () {
    function JsApi(arg) {
        this.content = arg.content || [];
        this.parentNode = arg.parentNode;
        this.elem = arg.elem;
        this.prefix = arg.prefix;
        this.local = arg.local;
        this.attrs = arg.attrs;
        this.comment = arg.comment;
        this.processingInstruction = arg.processingInstruction;
    }
    JsApi.prototype.isElem = function (elemNames) {
        if (!elemNames) {
            return !!this.elem;
        }
        if (Array.isArray(elemNames)) {
            return !!this.elem && elemNames.indexOf(this.elem) >= 0;
        }
        return !!this.elem && this.elem === elemNames;
    };
    JsApi.prototype.isEmpty = function () {
        return !this.content.length;
    };
    JsApi.prototype.spliceContent = function (start, n, insertion) {
        if (!Array.isArray(insertion)) {
            insertion = Array.apply(undefined, arguments).slice(2);
        }
        insertion.forEach(function (inner) {
            inner.parentNode = this;
        }, this);
        return this.content.splice.apply(this.content, [start, n].concat(insertion));
    };
    JsApi.prototype.hasAttr = function (name, val) {
        if (!this.attrs || !Object.keys(this.attrs).length) {
            return false;
        }
        if (!arguments.length) {
            return !!this.attrs;
        }
        if (val !== undefined) {
            return !!this.attrs[name] && this.attrs[name].value === val.toString();
        }
        return !!this.attrs[name];
    };
    JsApi.prototype.attr = function (name, val) {
        if (!this.hasAttr() || !arguments.length) {
            return undefined;
        }
        if (val !== undefined) {
            return this.hasAttr(name, val) ? this.attrs[name] : undefined;
        }
        return this.attrs[name];
    };
    JsApi.prototype.removeAttr = function (name) {
        if (!arguments.length) {
            return false;
        }
        if (Array.isArray(name)) {
            name.forEach(this.removeAttr, this);
        }
        if (!this.hasAttr(name)) {
            return false;
        }
        delete this.attrs[name];
        if (!Object.keys(this.attrs).length) {
            delete this.attrs;
        }
        return true;
    };
    JsApi.prototype.addAttr = function (attr) {
        attr = attr || {};
        if (attr.name === undefined ||
            attr.prefix === undefined ||
            attr.local === undefined) {
            return false;
        }
        this.attrs = this.attrs || {};
        this.attrs[attr.name] = attr;
        return this.attrs[attr.name];
    };
    JsApi.prototype.eachAttr = function (callback, context) {
        if (!this.hasAttr()) {
            return false;
        }
        for (var _i = 0, _a = Object.keys(this.attrs); _i < _a.length; _i++) {
            var name = _a[_i];
            callback.call(context, this.attrs[name]);
        }
        return true;
    };
    return JsApi;
}());
exports.JsApi = JsApi;
//# sourceMappingURL=jsapi.js.map