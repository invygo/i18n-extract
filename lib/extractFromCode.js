"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractFromCode;

var _babylon = require("babylon");

var _traverse = _interopRequireDefault(require("@babel/traverse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var noInformationTypes = ['CallExpression', 'Identifier', 'MemberExpression'];

function getKeys(node) {
  if (node.type === 'StringLiteral') {
    return [node.value];
  } else if (node.type === 'BinaryExpression' && node.operator === '+') {
    var left = getKeys(node.left);
    var right = getKeys(node.right);

    if (left.length > 1 || right.length > 1) {
      console.warn('Unsupported multiple keys for binary expression, keys skipped.'); // TODO
    }

    return [left[0] + right[0]];
  } else if (node.type === 'TemplateLiteral') {
    return [node.quasis.map(function (quasi) {
      return quasi.value.cooked;
    }).join('*')];
  } else if (node.type === 'ConditionalExpression') {
    return _toConsumableArray(getKeys(node.consequent)).concat(_toConsumableArray(getKeys(node.alternate)));
  } else if (node.type === 'LogicalExpression') {
    switch (node.operator) {
      case '&&':
        return _toConsumableArray(getKeys(node.right));

      case '||':
        return _toConsumableArray(getKeys(node.left)).concat(_toConsumableArray(getKeys(node.right)));

      default:
        console.warn("unsupported logicalExpression's operator: ".concat(node.operator));
        return [null];
    }
  } else if (noInformationTypes.includes(node.type)) {
    return ['*']; // We can't extract anything.
  }

  console.warn("Unsupported node: ".concat(node.type));
  return [null];
}

var commentRegExp = /i18n-extract (.+)/;
var commentIgnoreRegExp = /i18n-extract-disable-line/;

function extractFromCode(code) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$marker = options.marker,
      marker = _options$marker === void 0 ? 'i18n' : _options$marker,
      _options$keyLoc = options.keyLoc,
      keyLoc = _options$keyLoc === void 0 ? 0 : _options$keyLoc,
      _options$parser = options.parser,
      parser = _options$parser === void 0 ? 'flow' : _options$parser,
      _options$keyTr = options.keyTr,
      keyTr = _options$keyTr === void 0 ? 2 : _options$keyTr;
  var availableParsers = ['flow', 'typescript'];

  if (!availableParsers.includes(parser)) {
    throw new Error('Parser must be either flow or typescript');
  }

  var ast = (0, _babylon.parse)(code, {
    sourceType: 'module',
    // Enable all the plugins
    plugins: ['jsx', 'asyncFunctions', 'classConstructorCall', 'doExpressions', 'trailingFunctionCommas', 'objectRestSpread', 'decorators', 'classProperties', 'exportExtensions', 'exponentiationOperator', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport', 'optionalChaining'].concat([parser])
  });
  var keys = [];
  var ignoredLines = []; // Look for keys in the comments.

  ast.comments.forEach(function (comment) {
    var match = commentRegExp.exec(comment.value);

    if (match) {
      keys.push({
        key: match[1].trim(),
        loc: comment.loc
      });
    } // Check for ignored lines


    match = commentIgnoreRegExp.exec(comment.value);

    if (match) {
      ignoredLines.push(comment.loc.start.line);
    }
  }); // Look for keys in the source code.

  (0, _traverse.default)(ast, {
    CallExpression: function CallExpression(path) {
      var node = path.node;

      if (ignoredLines.includes(node.loc.end.line)) {
        // Skip ignored lines
        return;
      }

      var _node$callee = node.callee,
          name = _node$callee.name,
          type = _node$callee.type;

      if (type === 'Identifier' && name === marker || path.get('callee').matchesPattern(marker)) {
        var foundKeys = getKeys(keyLoc < 0 ? node.arguments[node.arguments.length + keyLoc] : node.arguments[keyLoc]);
        var translate = getKeys(keyTr < 0 ? node.arguments[node.arguments.length + keyTr] : node.arguments[keyTr]);
        foundKeys.forEach(function (key) {
          if (key) {
            keys.push({
              key: key,
              translate: translate.length > 0 ? translate[0] : null,
              loc: node.loc
            });
          }
        });
      }
    }
  });
  return keys;
}