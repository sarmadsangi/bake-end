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
    gqlMiddleware: (req, res, next) => {
      req.user = {
        name: 'sarmad'
      }
      req.permissions = {
        Test: { canView: false, canRemove: false, canUpdate: false }
      }
      next()
    },
    app: app
  }
).run()
