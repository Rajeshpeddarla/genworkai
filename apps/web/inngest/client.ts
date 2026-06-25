import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "genworkai-automation-studio",
  eventKey: process.env.INNGEST_EVENT_KEY || "local"
});
