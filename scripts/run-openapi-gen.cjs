const { register, require: tsxRequire } = require('tsx/cjs/api')
const path = require('node:path')

const unregister = register()

try {
  tsxRequire(path.resolve(__dirname, 'gen-openapi.ts'), __filename)
} finally {
  unregister()
}
