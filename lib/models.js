import mongoose from 'mongoose'
const Schema = mongoose.Schema

// Creates Mongoose Schema and Models based on Data Requirements
// returns model name, generated schema, generated model and schema fields
export function autoGenerateModels(dataRequirements) {

  return Object.keys(dataRequirements).map(modelName => {
    const modelFields = dataRequirements[modelName]
    const mongooseSchema = Schema(modelFields)
    const mongooseModel = mongoose.model(modelName, mongooseSchema)

    return {
      name: modelName,
      schema: mongooseSchema,
      model: mongooseModel,
      fields: modelFields
    }
  })
}
