const BakeEnd = require('../../dist/main')

BakeEnd(
  {
    mongoURL: 'mongodb://yourdbpath',
    dataRequirements: {
      Test: {
        title: { type: String },
        content: { type: String }
      }
    }
  }
)
