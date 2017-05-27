# Bake-end

### Usage

`yarn add bake-end --save`

```
const BakeEnd = require('bake-end')

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

```
