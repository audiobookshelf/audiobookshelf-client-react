import registry from './apiRegistry.json'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiEndpoint = {
  method: HttpMethod
  path: string
  operationId: string
  description?: string
  parameters?: Array<{
    name: string
    in: 'path' | 'query'
    required?: boolean
    description?: string
    schema: Record<string, unknown>
  }>
  requestBody?: {
    contentType: 'application/json' | 'multipart/form-data'
    schemaRef: string
  }
  response?: {
    status: number
    schemaRef?: string
  }
}

export const apiRegistry = registry as Record<string, ApiEndpoint>
