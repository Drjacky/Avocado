"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cli = require("commander");
var avocado_1 = require("./avocado");
var fs = require("fs");
var path = require("path");
var promisify = require('util.promisify');
var readFileFn = promisify(fs.readFile);
var readDirFn = promisify(fs.readdir);
var writeFileFn = promisify(fs.writeFile);
var avocado;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var pkgJson, input, output, nodeVersion, dir, i, outputDir, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pkgJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..') + '/package.json', 'utf8'));
                    cli
                        .version(pkgJson.version)
                        .arguments('[file]')
                        .option('-s, --string <string>', 'input VD or AVD string')
                        .option('-i, --input <file>', 'input file/directory, or "-" for STDIN')
                        .option('-o, --output <file>', 'output file/directory (same as the input file by default), or "-" for STDOUT')
                        .option('-d, --dir <dir>', 'optimize and rewrite all *.xml files in a directory')
                        .option('-q, --quiet', 'only output error messages')
                        .parse(process.argv);
                    input = cli.input ? [cli.input] : cli.args;
                    output = cli.output ? [cli.output] : undefined;
                    if ((!input.length || input[0] === '-') &&
                        !cli.string &&
                        !cli.dir &&
                        process.stdin.isTTY === true) {
                        cli.help();
                        return [2];
                    }
                    if (!(typeof process === 'object' &&
                        process.versions &&
                        process.versions.node &&
                        pkgJson.engines.node)) return [3, 2];
                    nodeVersion = String(pkgJson.engines.node).match(/\d*(\.\d+)*/)[0];
                    if (!(parseFloat(process.versions.node) < parseFloat(nodeVersion))) return [3, 2];
                    return [4, printErrorAndExit(pkgJson.name + " requires Node.js version " + nodeVersion + " or higher.")];
                case 1:
                    _a.sent();
                    return [2];
                case 2:
                    avocado = new avocado_1.Avocado();
                    if (output) {
                        if (input && input[0] !== '-') {
                            if (output.length === 1 && checkIsDir(output[0])) {
                                dir = output[0];
                                for (i = 0; i < input.length; i++) {
                                    output[i] = checkIsDir(input[i])
                                        ? input[i]
                                        : path.resolve(dir, path.basename(input[i]));
                                }
                            }
                            else if (output.length < input.length) {
                                output = output.concat(input.slice(output.length));
                            }
                        }
                    }
                    else if (input) {
                        output = input;
                    }
                    else if (cli.string) {
                        output = ['-'];
                    }
                    if (!cli.dir) return [3, 4];
                    outputDir = (output && output[0]) || cli.dir;
                    return [4, optimizeDirectory({ quiet: cli.quiet }, cli.dir, outputDir).then(function () { }, printErrorAndExit)];
                case 3:
                    _a.sent();
                    return [2];
                case 4:
                    if (!input) return [3, 9];
                    if (!(input[0] === '-')) return [3, 6];
                    return [4, new Promise(function (resolve, reject) {
                            var file = output[0];
                            var data = '';
                            process.stdin.on('data', function (chunk) { return (data += chunk); }).once('end', function () {
                                processData({ quiet: cli.quiet }, data, file).then(resolve, reject);
                            });
                        })];
                case 5:
                    _a.sent();
                    return [3, 8];
                case 6: return [4, Promise.all(input.map(function (file, n) {
                        return optimizeFile({ quiet: cli.quiet }, file, output[n]);
                    })).then(function () { }, printErrorAndExit)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [2];
                case 9:
                    if (!cli.string) return [3, 11];
                    data = cli.string;
                    return [4, processData({ quiet: cli.quiet }, data, output[0])];
                case 10:
                    _a.sent();
                    return [2];
                case 11: return [2];
            }
        });
    });
}
exports.run = run;
function optimizeDirectory(config, dir, output) {
    if (!config.quiet) {
        console.log("Processing directory '" + dir + "':\n");
    }
    return readDirFn(dir).then(function (files) {
        var svgFiles = files.filter(function (name) { return /\.xml$/.test(name); });
        return svgFiles.length
            ? Promise.all(svgFiles.map(function (name) {
                return optimizeFile(config, path.resolve(dir, name), path.resolve(output, name));
            }))
            : Promise.reject(new Error("No XML files were found in directory: '" + dir + "'"));
    });
}
function optimizeFile(config, file, output) {
    return readFileFn(file, 'utf8').then(function (data) { return processData(config, data, output, file); }, function (error) {
        if (error.code === 'EISDIR') {
            return optimizeDirectory(config, file, output);
        }
        return checkOptimizeFileError(config, file, output, error);
    });
}
function processData(config, data, output, input) {
    var startTime = Date.now();
    var prevFileSize = Buffer.byteLength(data, 'utf8');
    return avocado.optimize(data).then(function (result) {
        var resultFileSize = Buffer.byteLength(result, 'utf8');
        var processingTime = Date.now() - startTime;
        return writeOutput(input, output, result).then(function () {
            if (!config.quiet && output !== '-') {
                if (input) {
                    console.log("\n" + path.basename(input) + ":");
                }
                printTimeInfo(processingTime);
                printProfitInfo(prevFileSize, resultFileSize);
            }
        }, function (error) {
            return Promise.reject(new Error(error.code === 'ENOTDIR'
                ? "Output '" + output + "' is not a directory."
                : error));
        });
    });
}
function writeOutput(input, output, data) {
    if (output === '-') {
        console.log(data);
        return Promise.resolve();
    }
    return writeFileFn(output, data, 'utf8').catch(function (error) {
        return checkWriteFileError(input, output, data, error);
    });
}
function printTimeInfo(time) {
    console.log("Done in " + time + " ms!");
}
function printProfitInfo(inBytes, outBytes) {
    var profitPercents = 100 - outBytes * 100 / inBytes;
    console.log(Math.round(inBytes / 1024 * 1000) / 1000 +
        ' Kb' +
        (profitPercents < 0 ? ' + ' : ' - ') +
        '\x1b[32m' +
        String(Math.abs(Math.round(profitPercents * 10) / 10) + '%') +
        '\x1b[0m' +
        ' = ' +
        Math.round(outBytes / 1024 * 1000) / 1000 +
        ' Kb');
}
function checkOptimizeFileError(config, input, output, error) {
    if (error.code === 'ENOENT') {
        return Promise.reject(new Error("No such file or directory '" + error.path + "'."));
    }
    return Promise.reject(error);
}
function checkWriteFileError(input, output, data, error) {
    if (error.code === 'EISDIR' && input) {
        return writeFileFn(path.resolve(output, path.basename(input)), data, 'utf8');
    }
    else {
        return Promise.reject(error);
    }
}
function checkIsDir(filePath) {
    try {
        return fs.lstatSync(filePath).isDirectory();
    }
    catch (e) {
        return false;
    }
}
function printErrorAndExit(error) {
    console.error(error);
    process.exit(1);
    return Promise.reject(error);
}
//# sourceMappingURL=index.js.map