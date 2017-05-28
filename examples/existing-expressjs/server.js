const express = require('express')
const BakeEnd = require('../../dist/main')

const app = express()

app.get('/restofmyapp', function(req, res) {
  res.send('Rest Of My App')
})

BakeEnd(
  {
    mongoURL: 'mongodb://yourdbpath',
    dataRequirements: {
      Test: {
        title: { type: String },
        content: { type: String }
      }
    },
    app: app
  }
).run()
