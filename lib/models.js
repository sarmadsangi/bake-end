import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TYPE_MAP = {
  Image: {
    public_id: { type: String },
    url: { type: String }
  }
};

// Creates Mongoose Schema and Models based on Data Requirements
// returns model name, generated schema, generated model and schema fields
export function autoGenerateModels(dataRequirements) {
  let models = {};

  Object.keys(dataRequirements).forEach(modelName => {
    const { fields, beforeCreate } = dataRequirements[modelName];
    const mappedFields = {};
    Object.keys(fields).forEach(k => {
      if (!Array.isArray(fields[k])) {
        const field = { ...fields[k] };
        const mappedType = TYPE_MAP[field.type];
        if (mappedType) field.type = mappedType;
        mappedFields[k] = field;
      } else {
        mappedFields[k] = fields[k];
      }
    });
    console.log(fields);
    console.log(mappedFields);
    const mongooseSchema = Schema(mappedFields);
    const mongooseModel = mongoose.model(modelName, mongooseSchema);

    models[modelName] = {
      schema: mongooseSchema,
      model: mongooseModel,
      beforeCreate,
      fields
    };
  });

  return models;
}
