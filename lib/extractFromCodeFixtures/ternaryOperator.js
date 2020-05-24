"use strict";

var _i18n = _interopRequireDefault(require("i18n"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable */
var foo = 'bar'; // simple

(0, _i18n.default)(foo ? foo : 'bar'); // nested

(0, _i18n.default)(foo ? foo.length > 1 ? foo : 'baz' : 'bar');