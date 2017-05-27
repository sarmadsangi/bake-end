'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.autoGenerateModels = autoGenerateModels;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

// Creates Mongoose Schema and Models based on Data Requirements
// returns model name, generated schema, generated model and schema fields
function autoGenerateModels(dataRequirements) {

  return (0, _keys2.default)(dataRequirements).map(function (modelName) {
    var modelFields = dataRequirements[modelName];
    var mongooseSchema = Schema(modelFields);
    var mongooseModel = _mongoose2.default.model(modelName, mongooseSchema);

    return {
      name: modelName,
      schema: mongooseSchema,
      model: mongooseModel,
      fields: modelFields
    };
  });
}