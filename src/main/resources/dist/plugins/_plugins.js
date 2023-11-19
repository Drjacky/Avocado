"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function processPlugins(item, plugins) {
    plugins.forEach(function (batch) {
        switch (batch[0].type) {
            case 'perItem':
                item = perItem(item, batch);
                break;
            case 'perItemReverse':
                item = perItem(item, batch, true);
                break;
            case 'full':
                item = full(item, batch);
                break;
        }
    });
    return item;
}
exports.processPlugins = processPlugins;
function perItem(jsApi, plugins, reverse) {
    if (reverse === void 0) { reverse = false; }
    return (function recurseFn(item) {
        item.content = item.content.filter(function (i) {
            if (reverse && i.content) {
                recurseFn(i);
            }
            var filter = true;
            for (var j = 0; filter && j < plugins.length; j++) {
                var _a = plugins[j], active = _a.active, params = _a.params, fn = _a.fn;
                if (active && !fn(i, params)) {
                    filter = false;
                }
            }
            if (!reverse && i.content) {
                recurseFn(i);
            }
            return filter;
        });
        return item;
    })(jsApi);
}
function full(item, plugins) {
    plugins.forEach(function (_a) {
        var active = _a.active, params = _a.params, fn = _a.fn;
        item = active ? fn(item, params) : item;
    });
    return item;
}
//# sourceMappingURL=_plugins.js.map