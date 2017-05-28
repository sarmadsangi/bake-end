import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { makeExecutableSchema } from 'graphql-tools'
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import bodyParser from 'body-parser'
import { autoGenerateModels } from './models'
import { autoGenerateGraphQLSchema } from './schema'
const Schema = mongoose.Schema

module.exports = function BakeEnd(options) {
  const {
    mongoURL = 'mongodb://localhost:27017/test',
    dataRequirements,
    port = 4000,
    endpointURL = '/graphql',
    showGraphiql = true
  } = options

  mongoose
    .connect(mongoURL)
    .catch(() => console.error('Failed to connect to mongodb'))

  // TODO: validate dataRequirements before generating models and schemas
  const dbModels = autoGenerateModels(dataRequirements)
  const gqlSchema = autoGenerateGraphQLSchema(dataRequirements, dbModels)

  // TODO: use existing app instead of creating one if needed
  const app = express()

  app.use(cors())
  app.use(endpointURL, bodyParser.json(), graphqlExpress({ schema: gqlSchema }))
  if (showGraphiql) app.use('/graphiql', graphiqlExpress({ endpointURL }))

  app.listen(port)
}
