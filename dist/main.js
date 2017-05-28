'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _graphqlTools = require('graphql-tools');

var _graphqlServerExpress = require('graphql-server-express');

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _models = require('./models');

var _schema = require('./schema');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

module.exports = function BakeEnd(options) {
  var _options$mongoURL = options.mongoURL,
      mongoURL = _options$mongoURL === undefined ? 'mongodb://localhost:27017/test' : _options$mongoURL,
      dataRequirements = options.dataRequirements,
      _options$port = options.port,
      port = _options$port === undefined ? 4000 : _options$port,
      _options$endpointURL = options.endpointURL,
      endpointURL = _options$endpointURL === undefined ? '/graphql' : _options$endpointURL,
      _options$showGraphiql = options.showGraphiql,
      showGraphiql = _options$showGraphiql === undefined ? true : _options$showGraphiql;


  _mongoose2.default.connect(mongoURL).catch(function () {
    return console.error('Failed to connect to mongodb');
  });

  // TODO: validate dataRequirements before generating models and schemas
  var dbModels = (0, _models.autoGenerateModels)(dataRequirements);
  var gqlSchema = (0, _schema.autoGenerateGraphQLSchema)(dataRequirements, dbModels);

  // TODO: use existing app instead of creating one if needed
  var app = (0, _express2.default)();

  app.use((0, _cors2.default)());
  app.use(endpointURL, _bodyParser2.default.json(), (0, _graphqlServerExpress.graphqlExpress)({ schema: gqlSchema }));
  if (showGraphiql) app.use('/graphiql', (0, _graphqlServerExpress.graphiqlExpress)({ endpointURL: endpointURL }));

  app.listen(port);
};