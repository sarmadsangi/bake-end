"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

exports.autoGenerateModels = autoGenerateModels;

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Schema = _mongoose2.default.Schema;

var TYPE_MAP = {
  Image: {
    public_id: { type: String },
    url: { type: String }
  }
};

// Creates Mongoose Schema and Models based on Data Requirements
// returns model name, generated schema, generated model and schema fields
function autoGenerateModels(dataRequirements) {
  var models = {};

  (0, _keys2.default)(dataRequirements).forEach(function(modelName) {
    var _dataRequirements$mod = dataRequirements[modelName],
      fields = _dataRequirements$mod.fields,
      beforeCreate = _dataRequirements$mod.beforeCreate;

    var mappedFields = {};
    (0, _keys2.default)(fields).forEach(function(k) {
      if (!Array.isArray(fields[k])) {
        var field = (0, _extends3.default)({}, fields[k]);
        var mappedType = TYPE_MAP[field.type];
        if (mappedType) field.type = mappedType;
        mappedFields[k] = field;
      } else {
        mappedFields[k] = fields[k];
      }
    });
    console.log(fields);
    console.log(mappedFields);
    var mongooseSchema = Schema(mappedFields);
    var mongooseModel = _mongoose2.default.model(modelName, mongooseSchema);

    models[modelName] = {
      schema: mongooseSchema,
      model: mongooseModel,
      beforeCreate: beforeCreate,
      fields: fields
    };
  });

  return models;
}
