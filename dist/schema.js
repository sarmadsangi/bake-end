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

var PERMISSION_ACTION_MAP = {
  get: 'canView',
  list: 'canView',
  create: 'canCreate',
  update: 'canUpdate',
  remove: 'canRemove'
};

var permissionDenied = Error('Permission Denied');

var can = function can(modelName, action, permissions) {
  console.log('action:' + action + ', modelName:' + modelName, permissions);
  var permission = permissions[modelName];

  if (permission) {
    return permission[action];
  }

  return true;
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
    var queryType = 'get';
    var queryName = objectName.toLowerCase();

    getQueries[queryName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForGetQuery(modelObject.fields),
      resolve: function () {
        var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_, _ref2, _ref3) {
          var args = (0, _objectWithoutProperties3.default)(_ref2, []);
          var permissions = _ref3.permissions;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!can(objectName, queryType, permissions)) {
                    _context.next = 6;
                    break;
                  }

                  _context.next = 3;
                  return modelObject.model.findOne(sanitizeArgs(args));

                case 3:
                  _context.t0 = _context.sent;
                  _context.next = 7;
                  break;

                case 6:
                  _context.t0 = permissionDenied;

                case 7:
                  return _context.abrupt('return', _context.t0);

                case 8:
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
    var queryType = 'list';
    var queryName = '' + queryType + objectName + 's';

    listQueries[queryName] = {
      type: new _graphql.GraphQLList(ObjectTypes[objectName]),
      args: getAllPossibleArgsForListQuery(modelObject.fields),
      resolve: function () {
        var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(_, _ref5, _ref6) {
          var pageSize = _ref5.pageSize,
              pageNumber = _ref5.pageNumber,
              args = (0, _objectWithoutProperties3.default)(_ref5, ['pageSize', 'pageNumber']);
          var permissions = _ref6.permissions;
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (!can(objectName, queryType, permissions)) {
                    _context2.next = 6;
                    break;
                  }

                  _context2.next = 3;
                  return modelObject.model.find(sanitizeArgs(args));

                case 3:
                  _context2.t0 = _context2.sent;
                  _context2.next = 7;
                  break;

                case 6:
                  _context2.t0 = permissionDenied;

                case 7:
                  return _context2.abrupt('return', _context2.t0);

                case 8:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        function resolve(_x4, _x5, _x6) {
          return _ref4.apply(this, arguments);
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
    var mutationType = 'create';
    var mutationName = '' + mutationType + objectName;

    createMutations[mutationName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForCreateMutation(modelObject.fields),
      resolve: function () {
        var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(_, _ref8, context) {
          var args = (0, _objectWithoutProperties3.default)(_ref8, []);
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  if (!can(objectName, mutationType, context)) {
                    _context3.next = 6;
                    break;
                  }

                  _context3.next = 3;
                  return modelObject.model(args).save();

                case 3:
                  _context3.t0 = _context3.sent;
                  _context3.next = 7;
                  break;

                case 6:
                  _context3.t0 = permissionDenied;

                case 7:
                  return _context3.abrupt('return', _context3.t0);

                case 8:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        function resolve(_x7, _x8, _x9) {
          return _ref7.apply(this, arguments);
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
    var mutationType = 'update';
    var mutationName = '' + mutationType + objectName;

    updateMutations[mutationName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForUpdateMutation(modelObject.fields),
      resolve: function () {
        var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(_, _ref10, _ref11) {
          var id = _ref10.id,
              args = (0, _objectWithoutProperties3.default)(_ref10, ['id']);
          var permissions = _ref11.permissions;
          return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  if (!can(objectName, mutationType, permissions)) {
                    _context4.next = 6;
                    break;
                  }

                  _context4.next = 3;
                  return modelObject.model.findOneAndUpdate({ id: id }, args, { new: true });

                case 3:
                  _context4.t0 = _context4.sent;
                  _context4.next = 7;
                  break;

                case 6:
                  _context4.t0 = permissionDenied;

                case 7:
                  return _context4.abrupt('return', _context4.t0);

                case 8:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));

        function resolve(_x10, _x11, _x12) {
          return _ref9.apply(this, arguments);
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
    var mutationType = 'remove';
    var mutationName = '' + mutationType + objectName;

    removeMutations[mutationName] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForRemoveMutation(modelObject.fields),
      resolve: function () {
        var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(_, _ref13) {
          var args = (0, _objectWithoutProperties3.default)(_ref13, []);
          return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  if (!can(objectName, mutationType, permissions)) {
                    _context5.next = 6;
                    break;
                  }

                  _context5.next = 3;
                  return modelObject.model.remove(args);

                case 3:
                  _context5.t0 = _context5.sent;
                  _context5.next = 7;
                  break;

                case 6:
                  _context5.t0 = permissionDenied;

                case 7:
                  return _context5.abrupt('return', _context5.t0);

                case 8:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, this);
        }));

        function resolve(_x13, _x14) {
          return _ref12.apply(this, arguments);
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