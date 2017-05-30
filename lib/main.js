import express from 'express'
import mongoose from 'mongoose'
import { makeExecutableSchema } from 'graphql-tools'
import { parse } from 'graphql/language'
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import bodyParser from 'body-parser'
import { autoGenerateModels } from './models'
import { autoGenerateGraphQLSchema } from './schema'
const Schema = mongoose.Schema

module.exports = function BakeEnd(options) {
  const {
    mongoURL = 'mongodb://localhost:27017/test',
    dataRequirements,
    endpointURL = '/graphql',
    showGraphiql = true,
    // Provide an existing express app, if not it creates one
    app = express(),
    gqlMiddleware = (req, res, next) => next()
  } = options

  mongoose
    .connect(mongoURL)
    .catch(() => console.error('Failed to connect to mongodb'))

  // TODO: validate dataRequirements before generating models and schemas
  const dbModels = autoGenerateModels(dataRequirements)
  const gqlSchema = autoGenerateGraphQLSchema(dataRequirements, dbModels)

  // inject middleware if needed
  // expose DB Models via middleware
  const middlewares = [
      bodyParser.json(),
      (req, res, next) => {
        gqlMiddleware(req, res, next)
      }
  ];
  //
  // app.use(endpointURL, middlewares, graphqlExpress({
  //   schema: gqlSchema,
  //   context: {}
  // }))

  app.use(endpointURL, middlewares, graphqlExpress((req, res, next) => {
    const {
      user = {},
      permissions = {}
    } = req

    return {
      schema: gqlSchema,
      context: { user, permissions }
    }
  }))

  if (showGraphiql) app.use('/graphiql', graphiqlExpress({ endpointURL }))

  return {
    models: dbModels,
    schema: gqlSchema,
    run: (port = 4000) => app.listen(port)
  }
}
