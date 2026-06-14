// This script simulates a Model Context Protocol (MCP) gateway.
// In a real scenario, this would connect to a Native Messaging Host that runs a local MCP Server,
// OR it would run a WebSocket client connecting to a local MCP client.

console.log("GenWorkAI MCP Gateway initialized.");

export function initializeMCPBridge() {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.type === "MCP_REQUEST") {
        console.log("Received external MCP request from local agent:", request);
        
        if (request.method === "get_active_tab_context") {
          // Query the active tab and extract its context to pass back to the MCP Client
          chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0] && tabs[0].id) {
              const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extract_content' }) as any;
              if (response && response.success) {
                 sendResponse({
                   status: "success",
                   data: response.data
                 });
              } else {
                 sendResponse({ status: "error", message: "Could not extract content" });
              }
            }
          });
          return true; // Indicates async response
        }
      }
    }
  );
}
