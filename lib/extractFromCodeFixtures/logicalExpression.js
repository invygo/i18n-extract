"use strict";

var _i18n = _interopRequireDefault(require("i18n"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable */
var foo = true; // &&

(0, _i18n.default)(foo && 'bar'); // ||

(0, _i18n.default)(foo || 'baz'); // mixed

(0, _i18n.default)('bar' || foo && 'baz');