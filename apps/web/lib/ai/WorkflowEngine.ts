export class WorkflowEngine {
  constructor(public userId: string, public endpoint: any) {}

  async execute(body: any): Promise<{ data: any; metrics: any }> {
    return {
      data: { message: "Mock Workflow Execution Output", body },
      metrics: { llm_tokens: 150, requests: 1 }
    };
  }

  async executeStream(body: any): Promise<ReadableStream> {
    return new ReadableStream({
      start(controller) {
        controller.enqueue('data: {"choices":[{"delta":{"content":"Mock Stream response"}}]}\n\n');
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
      }
    });
  }
}
