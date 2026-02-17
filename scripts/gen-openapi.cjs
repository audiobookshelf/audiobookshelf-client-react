const { writeFile } = require('node:fs/promises')
const path = require('node:path')
const fs = require('node:fs')
const registry = require('../src/lib/apiRegistry.json')

if (typeof fs.globSync !== 'function') {
  fs.globSync = (pattern) => [pattern]
}

const { createGenerator } = require('ts-json-schema-generator')

const schemaId = (typeName) => typeName.replace(/[^A-Za-z0-9_]/g, '_')

const normalizeTypeName = (typeName) => {
  if (typeName.endsWith('[]')) {
    return typeName.slice(0, -2)
  }
  return typeName
}

const replaceRef = (ref) => ref.replace(/^#\/definitions\//, '#/components/schemas/')

const normalizeSchema = (schema) => {
  if (Array.isArray(schema)) {
    return schema.map(normalizeSchema)
  }
  if (schema && typeof schema === 'object') {
    const next = {}
    for (const [key, value] of Object.entries(schema)) {
      if (key === '$ref' && typeof value === 'string') {
        next.$ref = replaceRef(value)
        continue
      }
      next[key] = normalizeSchema(value)
    }
    return next
  }
  return schema
}

function buildOpenApi(endpoints) {
  const paths = {}
  const schemas = {}
  const schemaTypes = new Set()

  for (const endpoint of endpoints) {
    if (endpoint.response && endpoint.response.schemaRef) {
      schemaTypes.add(endpoint.response.schemaRef)
    }
    if (endpoint.requestBody) {
      if ('content' in endpoint.requestBody) {
        for (const schemaRef of Object.values(endpoint.requestBody.content)) {
          schemaTypes.add(schemaRef)
        }
      } else if (endpoint.requestBody.schemaRef) {
        schemaTypes.add(endpoint.requestBody.schemaRef)
      }
    }
  }

  if (schemaTypes.size > 0) {
    const generator = createGenerator({
      path: path.resolve(process.cwd(), 'src/types/api.ts'),
      tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
      type: '*',
      skipTypeCheck: true
    })

    for (const typeName of schemaTypes) {
      const normalizedType = normalizeTypeName(typeName)
      const rawSchema = generator.createSchema(normalizedType)
      const definitions = rawSchema.definitions || rawSchema.$defs || {}

      for (const [defName, defSchema] of Object.entries(definitions)) {
        if (!schemas[defName]) {
          schemas[defName] = normalizeSchema(defSchema)
        }
      }

      const topLevel = JSON.parse(JSON.stringify(rawSchema))
      delete topLevel.$schema
      delete topLevel.definitions
      delete topLevel.$defs

      const normalizedTop = normalizeSchema(topLevel)
      const topId = schemaId(typeName)
      const normalizedTopId = schemaId(normalizedType)
      const topRef = normalizedTop && normalizedTop.$ref
      const topRefName = typeof topRef === 'string' ? topRef.replace('#/components/schemas/', '') : null

      if (topRefName && topRefName === topId && schemas[topRefName]) {
        continue
      }

      if (!schemas[normalizedTopId]) {
        schemas[normalizedTopId] = normalizedTop
      }

      if (typeName.endsWith('[]')) {
        if (!schemas[topId]) {
          schemas[topId] = {
            type: 'array',
            items: { $ref: `#/components/schemas/${normalizedTopId}` }
          }
        }
      } else if (!schemas[topId]) {
        schemas[topId] = normalizedTop
      }
    }
  }

  const extractPathParams = (pathTemplate) => {
    const params = []
    const regex = /{([^}]+)}/g
    let match
    while ((match = regex.exec(pathTemplate)) !== null) {
      params.push({
        name: match[1],
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `Path parameter: ${match[1]}`
      })
    }
    return params
  }

  const mergeParameters = (pathParams, registryParams) => {
    const merged = []
    const seen = new Set()

    for (const param of [...pathParams, ...(registryParams || [])]) {
      const key = `${param.in}:${param.name}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      merged.push(param)
    }

    return merged
  }

  for (const endpoint of endpoints) {
    if (endpoint.path.startsWith('/internal-api/')) {
      continue
    }

    const method = endpoint.method.toLowerCase()
    const status = (endpoint.response && endpoint.response.status) || 200
    const schemaRef = endpoint.response && endpoint.response.schemaRef

    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {}
    }

    const parameters = mergeParameters(extractPathParams(endpoint.path), endpoint.parameters)

    const buildRequestBody = () => {
      if (!endpoint.requestBody) {
        return undefined
      }

      if ('content' in endpoint.requestBody) {
        const content = {}
        for (const [contentType, schemaRef] of Object.entries(endpoint.requestBody.content)) {
          content[contentType] = {
            schema: { $ref: `#/components/schemas/${schemaId(schemaRef)}` }
          }
        }
        return { required: true, content }
      }

      return {
        required: true,
        content: {
          [endpoint.requestBody.contentType]: {
            schema: { $ref: `#/components/schemas/${schemaId(endpoint.requestBody.schemaRef)}` }
          }
        }
      }
    }

    const operation = {
      operationId: endpoint.operationId,
      description: endpoint.description,
      parameters: parameters.length > 0 ? parameters : undefined,
      requestBody: buildRequestBody(),
      responses: {
        [status]: schemaRef
          ? {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaId(schemaRef)}` }
                }
              }
            }
          : { description: 'Success' }
      }
    }

    if (!operation.parameters) {
      delete operation.parameters
    }

    if (!operation.requestBody) {
      delete operation.requestBody
    }

    paths[endpoint.path][method] = operation
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Audiobookshelf Client API (Client-derived)',
      version: '0.1.0'
    },
    paths,
    components: { schemas }
  }
}

async function main() {
  const endpoints = Object.values(registry)
  const openapi = buildOpenApi(endpoints)
  const outPath = path.resolve(process.cwd(), 'openapi.json')
  await writeFile(outPath, JSON.stringify(openapi, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
