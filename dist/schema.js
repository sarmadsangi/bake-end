'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

exports.autoGenerateGraphQLSchema = autoGenerateGraphQLSchema;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _type = require('graphql/type');

var _graphql = require('graphql');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TYPE_MAP = {
  ObjectId: _graphql.GraphQLID,
  String: _graphql.GraphQLString,
  Boolean: _graphql.GraphQLBoolean,
  Number: _graphql.GraphQLID
};

var getGQLField = function getGQLField(field, ObjectTypes) {
  if (Array.isArray(field)) {
    var _keyType = field[0].type.name;
    var keyRef = field[0].ref;
    var _gqlType = TYPE_MAP[_keyType];

    return { type: new _graphql.GraphQLList(_gqlType || ObjectTypes[keyRef]) };
  }

  var keyType = field.type.name;
  var gqlType = TYPE_MAP[keyType];
  return { type: gqlType };
};

// change mongose _id from string to mongoose.Types.ObjectId
var sanitizeArgs = function sanitizeArgs(args) {
  var id = args.id,
      restOfArgs = (0, _objectWithoutProperties3.default)(args, ['id']);

  var sanitizedArgs = (0, _extends3.default)({}, restOfArgs);

  if (id) {
    sanitizedArgs['_id'] = _mongoose2.default.Types.ObjectId(id);
  }

  return sanitizedArgs;
};

var getAllPossibleArgsForGetQuery = function getAllPossibleArgsForGetQuery(modelFields) {
  var args = { id: { type: _graphql.GraphQLID } };

  (0, _keys2.default)(modelFields).forEach(function (key) {
    args[key] = getGQLField(modelFields[key]);
  });

  return args;
};

var getAllPossibleArgsForListQuery = function getAllPossibleArgsForListQuery(modelFields) {
  return (0, _extends3.default)({}, getAllPossibleArgsForGetQuery(modelFields), {
    pageNumber: { type: _graphql.GraphQLInt },
    pageSize: { type: _graphql.GraphQLInt }
  });
};

var getAllPossibleArgsForCreateMutation = function getAllPossibleArgsForCreateMutation(modelFields) {
  var args = {};

  (0, _keys2.default)(modelFields).forEach(function (key) {
    args[key] = getGQLField(modelFields[key]);
  });

  return args;
};

var getAllPossibleArgsForUpdateMutation = function getAllPossibleArgsForUpdateMutation(modelFields) {
  return getAllPossibleArgsForGetQuery(modelFields);
};
var getAllPossibleArgsForRemoveMutation = function getAllPossibleArgsForRemoveMutation(modelFields) {
  return getAllPossibleArgsForGetQuery(modelFields);
};

// Object types and fields for dataRequirements
function generateObjectTypes(dataRequirements) {
  // Generate GraphQL Object Types for all Mongo Models
  var objectTypes = {};
  (0, _keys2.default)(dataRequirements).map(function (modelName) {
    var modelFields = dataRequirements[modelName];

    // Map Mongo Fields Types to GraphQL Types
    var gqlFields = { id: { type: _graphql.GraphQLID } };
    (0, _keys2.default)(modelFields).forEach(function (k) {
      var field = modelFields[k];
      gqlFields[k] = getGQLField(field, objectTypes);
    });

    // Create GraphQL Schema Objects
    var gqlObjectType = new _graphql.GraphQLObjectType({
      name: modelName + 'Type',
      fields: gqlFields
    });

    objectTypes[modelName] = gqlObjectType;
  });

  return objectTypes;
}

function generateGetQueries(ObjectTypes, modelObjects) {
  var getQueries = {};

  (0, _keys2.default)(ObjectTypes).forEach(function (objectName) {

    var modelObject = modelObjects[objectName];

    getQueries[objectName.toLowerCase()] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForGetQuery(modelObject.fields),
      resolve: function () {
        var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_, _ref2, context) {
          var args = (0, _objectWithoutProperties3.default)(_ref2, []);
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return modelObject.model.findOne(sanitizeArgs(args));

                case 2:
                  return _context.abrupt('return', _context.sent);

                case 3:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function resolve(_x, _x2, _x3) {
          return _ref.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });

  return getQueries;
}

function generateListQueries(ObjectTypes, modelObjects) {
  var listQueries = {};

  (0, _keys2.default)(ObjectTypes).forEach(function (objectName) {

    var modelObject = modelObjects[objectName];

    listQueries['list' + objectName + 's'] = {
      type: new _graphql.GraphQLList(ObjectTypes[objectName]),
      args: getAllPossibleArgsForListQuery(modelObject.fields),
      resolve: function () {
        var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(_, _ref4) {
          var pageSize = _ref4.pageSize,
              pageNumber = _ref4.pageNumber,
              args = (0, _objectWithoutProperties3.default)(_ref4, ['pageSize', 'pageNumber']);
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return modelObject.model.find(sanitizeArgs(args));

                case 2:
                  return _context2.abrupt('return', _context2.sent);

                case 3:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        function resolve(_x4, _x5) {
          return _ref3.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });

  return listQueries;
}

function generateCreateMutations(ObjectTypes, modelObjects) {
  var createMutations = {};

  (0, _keys2.default)(ObjectTypes).forEach(function (objectName) {

    var modelObject = modelObjects[objectName];

    createMutations['create' + objectName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForCreateMutation(modelObject.fields),
      resolve: function () {
        var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(_, _ref6, context) {
          var args = (0, _objectWithoutProperties3.default)(_ref6, []);
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.next = 2;
                  return modelObject.model(args).save();

                case 2:
                  return _context3.abrupt('return', _context3.sent);

                case 3:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        function resolve(_x6, _x7, _x8) {
          return _ref5.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });

  return createMutations;
}

function generateUpdateMutations(ObjectTypes, modelObjects) {
  var updateMutations = {};

  (0, _keys2.default)(ObjectTypes).forEach(function (objectName) {

    var modelObject = modelObjects[objectName];

    updateMutations['update' + objectName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForUpdateMutation(modelObject.fields),
      resolve: function () {
        var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(_, _ref8) {
          var id = _ref8.id,
              args = (0, _objectWithoutProperties3.default)(_ref8, ['id']);
          return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.next = 2;
                  return modelObject.model.findOneAndUpdate({ id: id }, args, { new: true });

                case 2:
                  return _context4.abrupt('return', _context4.sent);

                case 3:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));

        function resolve(_x9, _x10) {
          return _ref7.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });

  return updateMutations;
}

function generateRemoveMutations(ObjectTypes, modelObjects) {
  var removeMutations = {};

  (0, _keys2.default)(ObjectTypes).forEach(function (objectName) {

    var modelObject = modelObjects[objectName];

    removeMutations['remove' + objectName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForRemoveMutation(modelObject.fields),
      resolve: function () {
        var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(_, _ref10) {
          var args = (0, _objectWithoutProperties3.default)(_ref10, []);
          return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return modelObject.model.remove(args);

                case 2:
                  return _context5.abrupt('return', _context5.sent);

                case 3:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, this);
        }));

        function resolve(_x11, _x12) {
          return _ref9.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });

  return removeMutations;
}

function autoGenerateGraphQLSchema(dataRequirements, modelObjects) {

  // Generate GraphQL Object Types for all Mongo Models
  var gqlObjectTypes = generateObjectTypes(dataRequirements);

  // Generate queries
  var getQueries = generateGetQueries(gqlObjectTypes, modelObjects);
  var listQueries = generateListQueries(gqlObjectTypes, modelObjects);
  var allQueries = (0, _extends3.default)({}, getQueries, listQueries);

  var rootQuery = new _graphql.GraphQLObjectType({
    name: 'RootQuery',
    fields: allQueries
  });

  // Generate mutations
  var createMutation = generateCreateMutations(gqlObjectTypes, modelObjects);
  var updateMutations = generateUpdateMutations(gqlObjectTypes, modelObjects);
  var removeMutations = generateRemoveMutations(gqlObjectTypes, modelObjects);
  var allMutations = (0, _extends3.default)({}, createMutation, updateMutations, removeMutations);

  var rootMutation = new _graphql.GraphQLObjectType({
    name: 'RootMutation',
    fields: allMutations
  });

  return new _type.GraphQLSchema({
    query: rootQuery,
    mutation: rootMutation
  });
}