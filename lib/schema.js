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

const getGQLField = (field, ObjectTypes) => {
  if (Array.isArray(field)) {
    const keyType = field[0].type.name
    const keyRef = field[0].ref
    const gqlType = TYPE_MAP[keyType]

    return { type: new GraphQLList(gqlType || ObjectTypes[keyRef]) }
  }

  const keyType = field.type.name
  const gqlType = TYPE_MAP[keyType]
  return { type: gqlType }
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
    args[key] = getGQLField(modelFields[key])
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
    args[key] = getGQLField(modelFields[key])
  })

  return args
}

const getAllPossibleArgsForUpdateMutation = (modelFields) => getAllPossibleArgsForGetQuery(modelFields)
const getAllPossibleArgsForRemoveMutation = (modelFields) => getAllPossibleArgsForGetQuery(modelFields)


// Object types and fields for dataRequirements
function generateObjectTypes(dataRequirements) {
  // Generate GraphQL Object Types for all Mongo Models
  let objectTypes = {}
  Object.keys(dataRequirements).map(modelName => {
    const modelFields = dataRequirements[modelName]

    // Map Mongo Fields Types to GraphQL Types
    let gqlFields = { id: { type: GraphQLID } }
    Object.keys(modelFields).forEach(k => {
      const field = modelFields[k]
      gqlFields[k] = getGQLField(field, objectTypes)
    })

    // Create GraphQL Schema Objects
    var gqlObjectType = new GraphQLObjectType({
      name: `${modelName}Type`,
      fields: gqlFields
    })

    objectTypes[modelName] = gqlObjectType
  })

  return objectTypes
}

function generateGetQueries(ObjectTypes, modelObjects) {
  let getQueries = {}

  Object.keys(ObjectTypes).forEach(objectName => {

    const modelObject = modelObjects[objectName]

    getQueries[objectName.toLowerCase()] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForGetQuery(modelObject.fields),
      resolve: async function (_, {...args}, context) {
        return await modelObject.model.findOne(sanitizeArgs(args))
      }
    }

  })

  return getQueries
}

function generateListQueries(ObjectTypes, modelObjects) {
  let listQueries = {}

  Object.keys(ObjectTypes).forEach(objectName => {

    const modelObject = modelObjects[objectName]

    listQueries[`list${objectName}s`] = {
      type: new GraphQLList(ObjectTypes[objectName]),
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

  Object.keys(ObjectTypes).forEach(objectName => {

    const modelObject = modelObjects[objectName]

    createMutations[`create${objectName}`] = {
      type: ObjectTypes[objectName],
      args: getAllPossibleArgsForCreateMutation(modelObject.fields),
      resolve: async function (_, { ...args }, context) {
        return await modelObject.model(args).save()
      }
    }

  })

  return createMutations
}

function generateUpdateMutations(ObjectTypes, modelObjects) {
  let updateMutations = {}

  Object.keys(ObjectTypes).forEach(objectName => {

    const modelObject = modelObjects[objectName]

    updateMutations[`update${objectName}`] = {
      type: ObjectTypes[objectName],
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

  Object.keys(ObjectTypes).forEach(objectName => {

    const modelObject = modelObjects[objectName]

    removeMutations[`remove${objectName}`] = {
      type: ObjectTypes[objectName],
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
