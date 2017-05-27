const BakeEnd = require('../dist/main')

BakeEnd(
  {
    mongoURL: 'mongodb://yourmongodb_url/dbname',
    dataRequirements: {
      post: {
        title: { type: String },
        content: { type: String }
      }
    }
  }
)
