"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var entities = {
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
    '>': '&gt;',
    '<': '&lt;',
};
var defaults = {
    doctypeStart: '<!DOCTYPE',
    doctypeEnd: '>',
    procInstStart: '<?',
    procInstEnd: '?>',
    tagOpenStart: '<',
    tagOpenEnd: '>',
    tagCloseStart: '</',
    tagCloseEnd: '>',
    tagShortStart: '<',
    tagShortEnd: '/>',
    attrStart: '="',
    attrEnd: '"',
    commentStart: '<!--',
    commentEnd: '-->',
    cdataStart: '<![CDATA[',
    cdataEnd: ']]>',
    textStart: '',
    textEnd: '',
    indentSize: 4,
    regEntities: /[&'"<>]/g,
    regValEntities: /[&"<>]/g,
    encodeEntity: function (char) { return entities[char]; },
    pretty: false,
    useShortTags: true,
};
function js2xml(data, options) {
    return new Js2Xml(options).convert(data);
}
exports.js2xml = js2xml;
var Js2Xml = (function () {
    function Js2Xml(options) {
        this.indentLevel = 0;
        if (options) {
            this.options = __assign({}, defaults, options);
        }
        else {
            this.options = defaults;
        }
        if (this.options.pretty) {
            this.options.doctypeEnd += os_1.EOL;
            this.options.procInstEnd += os_1.EOL;
            this.options.commentEnd += os_1.EOL;
            this.options.cdataEnd += os_1.EOL;
            this.options.tagShortEnd += os_1.EOL;
            this.options.tagOpenEnd += os_1.EOL;
            this.options.tagCloseEnd += os_1.EOL;
            this.options.textEnd += os_1.EOL;
        }
    }
    Js2Xml.prototype.convert = function (data) {
        var xml = '';
        if (data.content) {
            this.indentLevel++;
            data.content.forEach(function (item) {
                if (item.elem) {
                    xml += this.createElem(item);
                }
                else if (item.processingInstruction) {
                    xml += this.createProcInst(item.processingInstruction);
                }
                else if (item.comment) {
                    xml += this.createComment(item.comment.text);
                }
            }, this);
        }
        this.indentLevel--;
        return xml;
    };
    Js2Xml.prototype.createIndent = function () {
        var indent = '';
        if (this.options.pretty) {
            indent = '    '.repeat(this.indentLevel - 1);
        }
        return indent;
    };
    Js2Xml.prototype.createComment = function (comment) {
        return this.options.commentStart + comment + this.options.commentEnd;
    };
    Js2Xml.prototype.createProcInst = function (instruction) {
        return (this.options.procInstStart +
            instruction.name +
            ' ' +
            instruction.body +
            this.options.procInstEnd);
    };
    Js2Xml.prototype.createElem = function (data) {
        if (data.isEmpty()) {
            if (this.options.useShortTags) {
                return (this.createIndent() +
                    this.options.tagShortStart +
                    data.elem +
                    this.createAttrs(data) +
                    this.options.tagShortEnd);
            }
            else {
                return (this.createIndent() +
                    this.options.tagShortStart +
                    data.elem +
                    this.createAttrs(data) +
                    this.options.tagOpenEnd +
                    this.options.tagCloseStart +
                    data.elem +
                    this.options.tagCloseEnd);
            }
        }
        else {
            var tagOpenStart = this.options.tagOpenStart;
            var tagOpenEnd = this.options.tagOpenEnd;
            var tagCloseStart = this.options.tagCloseStart;
            var tagCloseEnd = this.options.tagCloseEnd;
            var openIndent = this.createIndent();
            var dataEnd = '';
            var processedData = '' + this.convert(data);
            return (openIndent +
                tagOpenStart +
                data.elem +
                this.createAttrs(data) +
                tagOpenEnd +
                processedData +
                dataEnd +
                this.createIndent() +
                tagCloseStart +
                data.elem +
                tagCloseEnd);
        }
    };
    Js2Xml.prototype.createAttrs = function (elem) {
        var attrs = '';
        elem.eachAttr(function (attr) {
            if (attr.value !== undefined) {
                attrs +=
                    ' ' +
                        attr.name +
                        this.options.attrStart +
                        String(attr.value).replace(this.options.regValEntities, this.options.encodeEntity) +
                        this.options.attrEnd;
            }
            else {
                attrs += ' ' + attr.name;
            }
        }, this);
        return attrs;
    };
    return Js2Xml;
}());
//# sourceMappingURL=js2xml.js.map