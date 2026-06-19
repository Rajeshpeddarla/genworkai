import { NextResponse } from 'next/server';

export async function GET() {
  const openapi = {
    openapi: '3.1.0',
    info: {
      title: 'GenWorkAI Platform API',
      version: '1.0.0',
      description: 'Intelligence-as-a-Service Platform API for GenWorkAI',
    },
    servers: [
      {
        url: 'https://api.genworkai.com/v1',
        description: 'Production API',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      '/kb/{kbId}/search': {
        post: {
          summary: 'Semantic Search',
          description: 'Perform a hybrid semantic search (Vector + BM25) across a Knowledge Base.',
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'The search query' },
                    limit: { type: 'integer', default: 5, description: 'Number of results to return' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful search response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            content: { type: 'string' },
                            documentTitle: { type: 'string' },
                            sourceType: { type: 'string' },
                            similarity: { type: 'number' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/schemas/ErrorResponse' },
            '400': { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '/kb/{kbId}/ask': {
        post: {
          summary: 'RAG Answer',
          description: 'Ask a question and receive a grounded answer with citations.',
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['question'],
                  properties: {
                    question: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful grounded answer',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      answer: { type: 'string' },
                      sources: { type: 'array', items: { type: 'string' } },
                      confidence: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/kb/{kbId}/generate': {
        post: {
          summary: 'Generate Artifact',
          description: 'Generate a structured artifact (e.g. summary, report, flashcards) based on the KB.',
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['prompt', 'outputType'],
                  properties: {
                    prompt: { type: 'string' },
                    outputType: { type: 'string', enum: ['summary', 'flashcards', 'report'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful structured generation',
              content: {
                'application/json': {
                  schema: { type: 'object' } // varies by outputType
                }
              }
            }
          }
        }
      },
      '/db/{dbId}/schema': {
        get: {
          summary: 'Extract Database Schema',
          description: 'Extracts and returns the structured schema of the connected database.',
          parameters: [
            {
              name: 'dbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful schema extraction',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      schema: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/db/{dbId}/ask': {
        post: {
          summary: 'Database Text-to-SQL Query',
          description: 'Generates and optionally executes safe read-only SQL against the database.',
          parameters: [
            {
              name: 'dbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['question'],
                  properties: {
                    question: { type: 'string' },
                    execute: { type: 'boolean', default: true }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful SQL generation and execution',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sql: { type: 'string' },
                      explanation: { type: 'string' },
                      executed: { type: 'boolean' },
                      results: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/db/{dbId}/documentation': {
        get: {
          summary: 'Generate DB Documentation',
          description: 'Generates AI documentation explaining the schema tables and relationships.',
          parameters: [
            {
              name: 'dbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful documentation generation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      documentation: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return NextResponse.json(openapi);
}
