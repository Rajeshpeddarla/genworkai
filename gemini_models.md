# Gemini Models Reference

This document serves as a reference for the available Gemini models and their specific capabilities, token limits, and intended use cases, specifically focusing on the 2.5 and 3.x series.

## gemini-2.5-flash
Our best model in terms of price-performance, offering well-rounded capabilities. 2.5 Flash is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.

| Property | Description |
|---|---|
| Model code | `gemini-2.5-flash` |
| Supported data types | **Inputs** Text, images, video, audio **Output** Text |
| Token limits | **Input** 1,048,576 **Output** 65,536 |
| Capabilities | Caching, Code execution, File search, Function calling, Google Maps grounding, Search grounding, Structured outputs, Thinking, URL context |

---

## gemini-2.5-flash-native-audio-preview-12-2025
The Live API enables low-latency, real-time voice and video interactions. It processes continuous streams of audio, video, or text to deliver immediate, human-like spoken responses.

| Property | Description |
|---|---|
| Model code | `gemini-2.5-flash-native-audio-preview-12-2025` |
| Supported data types | **Inputs** Audio, video, text **Output** Audio and text |
| Token limits | **Input** 131,072 **Output** 8,192 |
| Capabilities | Audio generation, Function calling, Live API, Search grounding, Thinking |

---

## gemini-2.5-flash-lite
Our most cost-efficient multimodal model, offering the fastest performance for high-frequency, lightweight tasks. Best for high-volume classification, simple data extraction, and extremely low-latency applications.

| Property | Description |
|---|---|
| Model code | `gemini-2.5-flash-lite` |
| Supported data types | **Inputs** Text, image, video, audio, PDF **Output** Text |
| Token limits | **Input** 1,048,576 **Output** 65,536 |
| Capabilities | Caching, Code execution, File search, Function calling, Google Maps grounding, Search grounding, Structured outputs, Thinking, URL context |

---

## gemini-3.5-flash
Provides sustained frontier-level intelligence optimized for real-world tasks at a higher speed and lower cost. Designed for the agentic era, it excels at sub-agent deployment, multi-step workflows, and long-horizon tasks at scale.

| Property | Description |
|---|---|
| Model code | `gemini-3.5-flash` |
| Supported data types | **Inputs** Text, Image, Video, Audio, and PDF **Output** Text |
| Token limits | **Input** 1,048,576 **Output** 65,536 |
| Capabilities | Caching, Code execution, Computer use (Preview), File search, Function calling, Maps grounding, Search grounding, Structured outputs, Thinking, URL context |

---

## gemini-3.1-flash-lite
A low-latency, cost-effective multimodal model optimized for high-frequency, lightweight tasks. Best at handling straightforward tasks at significant scale such as Translation, Transcription, Lightweight agentic tasks/data extraction, Document processing/summarization, and Model routing.

| Property | Description |
|---|---|
| Model code | `gemini-3.1-flash-lite` |
| Supported data types | **Inputs** Text, Image, Video, Audio, and PDF **Output** Text |
| Token limits | **Input** 1,048,576 **Output** 65,536 |
| Capabilities | Caching, Code execution, File search, Function calling, Maps grounding, Search grounding, Structured outputs, Thinking, URL context |

---

## gemini-3-flash-preview
The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet, delivering richer visuals and deeper interactivity.

| Property | Description |
|---|---|
| Model code | `gemini-3-flash-preview` |
| Supported data types | **Inputs** Text, Image, Video, Audio, and PDF **Output** Text |
| Token limits | **Input** 1,048,576 **Output** 65,536 |
| Capabilities | Caching, Code execution, Computer use, File search, Function calling, Maps grounding, Search grounding, Structured outputs, Thinking, URL context |

---

## gemini-3.1-pro-preview
Built to refine the performance and reliability of the Gemini 3 Pro series, providing better thinking, improved token efficiency, and a more grounded, factually consistent experience. Optimized for software engineering behavior and complex agentic workflows.

| Property | Description |
|---|---|
| Model code | `gemini-3.1-pro-preview` |
| Supported data types | **Inputs** Text, Image, Video, Audio, and PDF **Output** Text |
| Token limits | **Input** 1,048,576 **Output** 65,536 |
| Capabilities | Caching, Code execution, File search, Function calling, Maps grounding, Search grounding, Structured outputs, Thinking, URL context |

*(Note: Use `gemini-3.1-pro-preview-customtools` when building with a mix of bash and custom tools for better tool prioritization).*
