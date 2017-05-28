const BakeEnd = require('../dist/main')

BakeEnd(
  {
    mongoURL: 'mongodb://yourmongodb_url/dbname',
    dataRequirements: {
      Test: {
        title: { type: String },
        content: { type: String }
      }
    }
  }
)
