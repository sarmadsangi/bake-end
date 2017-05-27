import mongoose from 'mongoose'
import { GraphQLSchema } from 'graphql/type'
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
  GraphQLBoolean,
  GraphQLList
} from 'graphql'


const TYPE_MAP = {
  ObjectId: GraphQLID,
  String: GraphQLString,
  Boolean: GraphQLBoolean,
  Number: GraphQLID
}

// change mongose _id from string to mongoose.Types.ObjectId
const sanitizeArgs = (args) => {
  const { id, ...restOfArgs } = args
  let sanitizedArgs = {
    ...restOfArgs
  }

  if (id) {
    sanitizedArgs['_id'] = mongoose.Types.ObjectId(id)
  }

  return sanitizedArgs;
}

const getAllPossibleArgsForGetQuery = (modelFields) => {
  let args = { id: { type: GraphQLID } }

  Object.keys(modelFields).forEach(key => {
    args[key] = { type: TYPE_MAP[modelFields[key].type.name] }
  })

  return args
}

const getAllPossibleArgsForListQuery = (modelFields) => {
  return {
    ...getAllPossibleArgsForGetQuery(modelFields),
    pageNumber: { type: GraphQLInt },
    pageSize: { type: GraphQLInt }
  }
}

const getAllPossibleArgsForCreateMutation = (modelFields) => {
  let args = {}

  Object.keys(modelFields).forEach(key => {
    args[key] = { type: TYPE_MAP[modelFields[key].type.name] }
  })

  return args
}

const getAllPossibleArgsForUpdateMutation = (modelFields) => getAllPossibleArgsForGetQuery(modelFields)
const getAllPossibleArgsForRemoveMutation = (modelFields) => getAllPossibleArgsForGetQuery(modelFields)


// Object types and fields for dataRequirements
function generateObjectTypes(dataRequirements) {
  // Generate GraphQL Object Types for all Mongo Models
  return Object.keys(dataRequirements).map(modelName => {
    const modelFields = dataRequirements[modelName]

    // Map Mongo Fields Types to GraphQL Types
    let gqlFields = { id: { type: GraphQLID } }
    Object.keys(modelFields).forEach(field => {
      const keyType = modelFields[field].type.name
      const gqlType = TYPE_MAP[keyType]

      if (gqlType) gqlFields[field] = { type: gqlType }
    })

    // Create GraphQL Schema Objects
    var gqlObjectType = new GraphQLObjectType({
      name: `${modelName}Type`,
      fields: gqlFields
    })

    return {
      name: modelName,
      type: gqlObjectType
    }
  })
}

function generateGetQueries(ObjectTypes, modelObjects) {
  let getQueries = {}

  ObjectTypes.forEach(objectType => {

    const modelObject = modelObjects.find(m => m.name === objectType.name)
    getQueries[objectType.name.toLowerCase()] = {
      type: objectType.type,
      args: getAllPossibleArgsForGetQuery(modelObject.fields),
      resolve: async function (_, {...args}) {
        return await modelObject.model.findOne(sanitizeArgs(args))
      }
    }

  })

  return getQueries
}

function generateListQueries(ObjectTypes, modelObjects) {
  let listQueries = {}

  ObjectTypes.forEach(objectType => {

    const modelObject = modelObjects.find(m => m.name === objectType.name)

    listQueries[`list${objectType.name}s`] = {
      type: new GraphQLList(objectType.type),
      args: getAllPossibleArgsForListQuery(modelObject.fields),
      resolve: async function (_, { pageSize, pageNumber, ...args }) {
        return await modelObject.model.find(sanitizeArgs(args))
      }
    }

  })

  return listQueries
}

function generateCreateMutations(ObjectTypes, modelObjects) {
  let createMutations = {}

  ObjectTypes.forEach(objectType => {

    const modelObject = modelObjects.find(m => m.name === objectType.name)

    createMutations[`create${objectType.name}`] = {
      type: objectType.type,
      args: getAllPossibleArgsForCreateMutation(modelObject.fields),
      resolve: async function (_, { ...args }) {
        return await modelObject.model(args).save()
      }
    }

  })

  return createMutations
}

function generateUpdateMutations(ObjectTypes, modelObjects) {
  let updateMutations = {}

  ObjectTypes.forEach(objectType => {

    const modelObject = modelObjects.find(m => m.name === objectType.name)

    updateMutations[`update${objectType.name}`] = {
      type: objectType.type,
      args: getAllPossibleArgsForUpdateMutation(modelObject.fields),
      resolve: async function (_, { id, ...args}) {
        return await modelObject.model.findOneAndUpdate({ id: id }, args, { new: true })
      }
    }

  })

  return updateMutations
}

function generateRemoveMutations(ObjectTypes, modelObjects) {
  let removeMutations = {}

  ObjectTypes.forEach(objectType => {

    const modelObject = modelObjects.find(m => m.name === objectType.name)

    removeMutations[`remove${objectType.name}`] = {
      type: objectType.type,
      args: getAllPossibleArgsForRemoveMutation(modelObject.fields),
      resolve: async function (_, { ...args }) {
        return await modelObject.model.remove(args)
      }
    }

  })

  return removeMutations
}

export function autoGenerateGraphQLSchema(dataRequirements, modelObjects) {

  // Generate GraphQL Object Types for all Mongo Models
  const gqlObjectTypes = generateObjectTypes(dataRequirements)

  // Generate queries
  const getQueries = generateGetQueries(gqlObjectTypes, modelObjects)
  const listQueries = generateListQueries(gqlObjectTypes, modelObjects)
  const allQueries = {...getQueries, ...listQueries}

  const rootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: allQueries
  })

  // Generate mutations
  const createMutation = generateCreateMutations(gqlObjectTypes, modelObjects)
  const updateMutations = generateUpdateMutations(gqlObjectTypes, modelObjects)
  const removeMutations = generateRemoveMutations(gqlObjectTypes, modelObjects)
  const allMutations = {...createMutation, ...updateMutations, ...removeMutations}

  const rootMutation = new GraphQLObjectType({
    name: 'RootMutation',
    fields: allMutations
  })

  return  new GraphQLSchema({
    query: rootQuery,
    mutation: rootMutation
  })

}
