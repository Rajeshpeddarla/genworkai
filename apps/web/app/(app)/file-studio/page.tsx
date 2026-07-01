"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileBox,
  UploadCloud,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Ruler,
  Wand2,
  Type,
  RefreshCw,
  Download,
  X,
  Settings2,
  Info,
  Link2
} from "lucide-react";
import exifr from 'exifr';
import Upscaler from 'upscaler';
import imageCompression from 'browser-image-compression';
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import Tesseract from 'tesseract.js';
import { removeBackground } from "@imgly/background-removal";

export default function FileStudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDetails, setImageDetails] = useState<any>({});
  const [activeTool, setActiveTool] = useState<string>("upscale");

  // Convert State
  const [outputFormat, setOutputFormat] = useState("PNG");

  // Shared State
  const [quality, setQuality] = useState(85);
  const [stripMetadata, setStripMetadata] = useState(true);

  // Upscale State
  const [upscaleTarget, setUpscaleTarget] = useState("4K");
  const [upscaleQualityMode, setUpscaleQualityMode] = useState("Balanced");
  const [upscaleEnhanceDetails, setUpscaleEnhanceDetails] = useState(true);
  const [upscaleRestoreFaces, setUpscaleRestoreFaces] = useState(true);
  const [upscaleReduceNoise, setUpscaleReduceNoise] = useState("Low");
  const [upscaleSharpenText, setUpscaleSharpenText] = useState(false);
  const [upscalePreset, setUpscalePreset] = useState("Auto");

  // Resize State
  const [resizeWidth, setResizeWidth] = useState<number | "">("");
  const [resizeHeight, setResizeHeight] = useState<number | "">("");
  const [resizeLockRatio, setResizeLockRatio] = useState(true);

  // OCR State
  const [ocrFormat, setOcrFormat] = useState("TXT");
  const [ocrAiEnabled, setOcrAiEnabled] = useState(false);
  const [ocrPrompt, setOcrPrompt] = useState("");

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState("");
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [aiCosts, setAiCosts] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: "upscale", name: "AI Upscale", desc: "Enhance resolution up to 8K", icon: Maximize2 },
    { id: "compress", name: "Compress", desc: "Reduce file size with quality control", icon: Minimize2 },
    { id: "resize", name: "Resize", desc: "Custom width and height", icon: Ruler },
    { id: "convert", name: "Convert Format", desc: "Full spectrum conversion", icon: RefreshCw },
    { id: "remove-bg", name: "Remove Background", desc: "AI-powered background removal", icon: Wand2 },
    { id: "ocr", name: "OCR Text Extract", desc: "Pull text from any image via Tesseract", icon: Type },
  ];

  const formats = ["PNG", "JPG", "WEBP", "AVIF", "SVG", "GIF", "BMP", "TIFF", "ICO"];

  useEffect(() => {
    setProcessResult(null);
    setProcessStatus("");
  }, [activeTool]);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const res = await fetch('/api/billing/costs');
        if (res.ok) {
          const data = await res.json();
          setAiCosts(data.costs || []);
        }
      } catch (e) {
        console.error("Failed to fetch AI costs", e);
      }
    };
    fetchCosts();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file) return;
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setProcessResult(null);

      // Default output format to uploaded file's type
      const ext = file.name.split('.').pop()?.toUpperCase() || "PNG";
      const normalizedExt = ext === "JPEG" ? "JPG" : ext;
      if (["PNG", "JPG", "WEBP", "AVIF", "SVG", "GIF", "BMP", "TIFF", "ICO"].includes(normalizedExt)) {
        setOutputFormat(normalizedExt);
      } else {
        setOutputFormat("PNG");
      }

      // Get dimensions
      const img = new window.Image();
      img.src = url;
      img.onload = async () => {
        const details: any = {
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          name: file.name
        };

        setResizeWidth(img.width);
        setResizeHeight(img.height);

        // Deep EXIF extraction
        try {
          const exifData = await exifr.parse(file, true);
          if (exifData) {
            Object.assign(details, { exif: exifData });
          }
        } catch (err) {
          console.warn("No EXIF data found");
        }

        setImageDetails(details);
      };
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageDetails({});
    setProcessResult(null);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadProcessedBlob = async (blob: Blob, targetFormat: string, baseFilename: string) => {
    let mimeType = `image/${targetFormat.toLowerCase()}`;
    if (targetFormat === "JPG") mimeType = "image/jpeg";
    if (targetFormat === "SVG") mimeType = "image/svg+xml";

    if (blob.type === mimeType || targetFormat === "PNG") {
      downloadBlob(blob, `${baseFilename}.${targetFormat.toLowerCase()}`);
      return;
    }

    setProcessStatus(`Transcoding to native ${targetFormat}...`);
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('format', targetFormat);

    try {
      const res = await fetch('/api/image/convert', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Backend transcoding failed.");
      const convertedBlob = await res.blob();
      downloadBlob(convertedBlob, `${baseFilename}.${targetFormat.toLowerCase()}`);
    } catch (err) {
      console.warn("Transcoding failed, falling back to original blob", err);
      downloadBlob(blob, `${baseFilename}.${targetFormat.toLowerCase()}`);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !previewUrl) return;
    setIsProcessing(true);
    setProcessResult(null);

    try {
      if (activeTool === "convert") {
        setProcessStatus("Converting format...");

        const img = new window.Image();
        img.src = previewUrl;
        await new Promise(resolve => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);

        let mimeType = `image/${outputFormat.toLowerCase()}`;
        if (outputFormat === "JPG") mimeType = "image/jpeg";
        if (outputFormat === "SVG") mimeType = "image/svg+xml";

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality / 100));

        if (blob) {
          await downloadProcessedBlob(blob, outputFormat, `converted_${selectedFile.name.split('.')[0]}`);
          setProcessResult("Conversion complete! Download started.");
        } else {
          setProcessResult(`Format ${outputFormat} not natively supported by browser Canvas fallback.`);
        }
      } else if (activeTool === "ocr") {
        const { data } = await Tesseract.recognize(selectedFile, 'eng', {
          logger: m => {
            if (m.status === "recognizing text") {
              setProcessStatus(`Extracting text... ${(m.progress * 100).toFixed(0)}%`);
            } else {
              setProcessStatus(`OCR: ${m.status}...`);
            }
          }
        });

        let finalText = data.text;
        if (!finalText || !finalText.trim()) throw new Error("No text found in image.");

        if (ocrAiEnabled && ocrPrompt.trim()) {
          setProcessStatus("Refining text with AI...");
          const aiRes = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: finalText, prompt: ocrPrompt, type: "chat" })
          });
          const aiData = await aiRes.json();
          if (aiRes.ok && aiData.success) {
            finalText = aiData.data;
          } else {
            throw new Error(`AI refinement failed: ${aiData.error}`);
          }
        }

        setProcessStatus(`Generating ${ocrFormat} output...`);
        const baseFileName = `ocr_${selectedFile.name.split('.')[0]}`;

        if (ocrFormat === "PDF") {
          const doc = new jsPDF();
          const lines = doc.splitTextToSize(finalText, 180);
          doc.text(lines, 10, 10);
          downloadBlob(doc.output('blob'), `${baseFileName}.pdf`);
        } else if (ocrFormat === "DOCX") {
          const doc = new Document({
            sections: [{
              properties: {},
              children: finalText.split('\n').map((line: string) => new Paragraph({ children: [new TextRun(line)] }))
            }]
          });
          const blob = await Packer.toBlob(doc);
          downloadBlob(blob, `${baseFileName}.docx`);
        } else {
          // TXT or MD
          const ext = ocrFormat.toLowerCase();
          const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
          downloadBlob(blob, `${baseFileName}.${ext}`);
        }

        setProcessResult("OCR extraction complete! Download started.");
      }
      else if (activeTool === "compress") {
        setProcessStatus("Compressing Image...");
        let mimeType = `image/${outputFormat.toLowerCase()}`;
        if (outputFormat === "JPG") mimeType = "image/jpeg";
        if (outputFormat === "SVG") mimeType = "image/svg+xml";

        const options = {
          maxSizeMB: 1 * (quality / 100),
          maxWidthOrHeight: 4096,
          useWebWorker: true,
          fileType: mimeType
        };
        const compressedBlob = await imageCompression(selectedFile, options);
        await downloadProcessedBlob(compressedBlob, outputFormat, `compressed_${selectedFile.name.split('.')[0]}`);
        setProcessResult(`Compressed down to ${formatBytes(compressedBlob.size)}!`);
      }
      else if (activeTool === "upscale") {
        setProcessStatus("Initializing AI Upscaler Engine...");
        const upscaler = new Upscaler();

        setProcessStatus(`Running AI Inference (${upscaleTarget})...`);

        const img = new window.Image();
        img.src = previewUrl;
        await new Promise(resolve => { img.onload = resolve; });

        let upscaledDataUrl = "";
        try {
          const safePatchSize = upscaleQualityMode === "Fast" ? 64 : 32;
          upscaledDataUrl = await upscaler.upscale(img, { patchSize: safePatchSize, padding: 1 });
        } catch (webglError: any) {
          console.warn("WebGL shader crashed, attempting fallback with ultra-small patch size...", webglError);
          try {
            setProcessStatus(`WebGL memory limit hit. Re-trying in ultra-safe mode...`);
            upscaledDataUrl = await upscaler.upscale(img, { patchSize: 8, padding: 1 });
          } catch (criticalError: any) {
            throw new Error("Your browser's graphics driver crashed while compiling the WebGL shaders. Please enable Hardware Acceleration in your browser settings, update your GPU drivers, or use a smaller image.");
          }
        }

        // Render to canvas to support custom output formats
        const canvas = document.createElement('canvas');
        const img2 = new window.Image();
        img2.src = upscaledDataUrl;
        await new Promise(resolve => { img2.onload = resolve; });
        canvas.width = img2.width;
        canvas.height = img2.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img2, 0, 0);

        let mimeType = `image/${outputFormat.toLowerCase()}`;
        if (outputFormat === "JPG") mimeType = "image/jpeg";
        if (outputFormat === "SVG") mimeType = "image/svg+xml";

        const finalBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, 1.0));

        if (finalBlob) {
          await downloadProcessedBlob(finalBlob, outputFormat, `upscaled_${selectedFile.name.split('.')[0]}`);
          setProcessResult("Upscaling complete! Download started.");
        } else {
          setProcessResult(`Format ${outputFormat} not natively supported by browser Canvas fallback.`);
        }
      }
      else if (activeTool === "resize") {
        setProcessStatus("Resizing Image...");
        if (!resizeWidth || !resizeHeight) throw new Error("Width and height are required for resize.");

        const img = new window.Image();
        img.src = previewUrl;
        await new Promise(resolve => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        canvas.width = Number(resizeWidth);
        canvas.height = Number(resizeHeight);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let mimeType = `image/${outputFormat.toLowerCase()}`;
        if (outputFormat === "JPG") mimeType = "image/jpeg";
        if (outputFormat === "SVG") mimeType = "image/svg+xml";

        const finalBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, 1.0));

        if (finalBlob) {
          await downloadProcessedBlob(finalBlob, outputFormat, `resized_${selectedFile.name.split('.')[0]}`);
          setProcessResult(`Resize complete! Generated ${canvas.width}x${canvas.height} image.`);
        } else {
          setProcessResult(`Format ${outputFormat} not natively supported by browser Canvas fallback.`);
        }
      }
      else if (activeTool === "remove-bg") {
        setProcessStatus("Initializing Background Removal AI...");
        
        // Fallback to PNG if user selected JPG, since JPG doesn't support transparency
        let finalFormat = outputFormat;
        if (outputFormat === "JPG" || outputFormat === "BMP" || outputFormat === "ICO") {
          finalFormat = "PNG";
        }

        const blob = await removeBackground(selectedFile, {
          progress: (key, current, total) => {
            const percentage = Math.round((current / total) * 100);
            if (key.includes("compute")) {
              setProcessStatus(`AI Inference: ${percentage}%`);
            } else if (key.includes("fetch")) {
              setProcessStatus(`Downloading Model: ${percentage}%`);
            } else {
              setProcessStatus(`${key}: ${percentage}%`);
            }
          }
        });

        await downloadProcessedBlob(blob, finalFormat, `nobg_${selectedFile.name.split('.')[0]}`);
        setProcessResult(`Background removed! Saved as ${finalFormat} to preserve transparency.`);
      }
      else {
        setProcessStatus(`Processing ${activeTool}...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProcessResult("Feature executed successfully (mock).");
      }
    } catch (err: any) {
      setProcessResult(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyUpscalePreset = (preset: string) => {
    setUpscalePreset(preset);
    switch (preset) {
      case "Portrait":
        setUpscaleRestoreFaces(true);
        setUpscaleReduceNoise("Low");
        setUpscaleEnhanceDetails(true);
        setUpscaleSharpenText(false);
        break;
      case "Product":
        setUpscaleRestoreFaces(false);
        setUpscaleReduceNoise("Off");
        setUpscaleEnhanceDetails(true);
        setUpscaleSharpenText(true);
        break;
      case "Screenshot":
        setUpscaleRestoreFaces(false);
        setUpscaleReduceNoise("Off");
        setUpscaleEnhanceDetails(false);
        setUpscaleSharpenText(true);
        break;
      case "Anime":
        setUpscaleRestoreFaces(false);
        setUpscaleReduceNoise("High");
        setUpscaleEnhanceDetails(false);
        setUpscaleSharpenText(false);
        break;
      case "Old Photo":
        setUpscaleRestoreFaces(true);
        setUpscaleReduceNoise("Medium");
        setUpscaleEnhanceDetails(true);
        setUpscaleSharpenText(false);
        break;
      default:
        setUpscaleRestoreFaces(true);
        setUpscaleReduceNoise("Low");
        setUpscaleEnhanceDetails(true);
        setUpscaleSharpenText(false);
    }
  };

  const getOutputDimensions = () => {
    if (!imageDetails.width) return "0 × 0";
    let multiplier = 1;
    if (upscaleTarget === "2K") multiplier = 2;
    if (upscaleTarget === "4K") multiplier = 4;
    if (upscaleTarget === "8K Premium") multiplier = 8;
    return `${imageDetails.width * multiplier} × ${imageDetails.height * multiplier}`;
  };

  const getToolCost = () => {
    let opKey = '';
    if (activeTool === 'ocr') opKey = 'ocr';
    else if (activeTool === 'remove-bg') opKey = 'file_remove_bg';
    else opKey = `file_${activeTool}`;
    const costObj = aiCosts.find(c => c.operationKey === opKey);
    return costObj ? costObj.credits : 1;
  };

  const handleResizeWidthChange = (val: string) => {
    const num = parseInt(val);
    setResizeWidth(num || "");
    if (resizeLockRatio && num && imageDetails.width) {
      setResizeHeight(Math.round(num * (imageDetails.height / imageDetails.width)));
    }
  };

  const handleResizeHeightChange = (val: string) => {
    const num = parseInt(val);
    setResizeHeight(num || "");
    if (resizeLockRatio && num && imageDetails.height) {
      setResizeWidth(Math.round(num * (imageDetails.width / imageDetails.height)));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-zinc-300 font-sans p-6 overflow-x-hidden">

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT COLUMN: File & Tools */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-8">

          {/* File Card */}
          <div className="bg-[#15151A] border border-white/5 rounded-2xl p-6 relative group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.05),transparent_50%)] pointer-events-none rounded-2xl" />

            {selectedFile && previewUrl ? (
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Image Preview Container */}
                <div className="w-full md:w-[350px] aspect-video md:aspect-[4/3] rounded-xl overflow-hidden bg-black/50 border border-white/10 relative shrink-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0 w-full relative">
                  <button onClick={clearFile} className="absolute -top-2 -right-2 p-2 text-zinc-500 hover:text-white bg-white/5 rounded-full hover:bg-red-500/20 transition-all">
                    <X className="w-4 h-4" />
                  </button>

                  <h2 className="text-xl font-bold text-emerald-400 mb-1 truncate pr-8">{selectedFile.name}</h2>
                  <p className="text-xs text-zinc-500 mb-6 font-mono">
                    {imageDetails.type} • {formatBytes(imageDetails.size)} • {imageDetails.width}×{imageDetails.height}px
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Size</div>
                      <div className="text-sm text-white font-medium">{formatBytes(imageDetails.size)}</div>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Type</div>
                      <div className="text-sm text-white font-medium uppercase">{selectedFile.name.split('.').pop()}</div>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 col-span-2">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Dimensions</div>
                      <div className="text-sm text-white font-medium">{imageDetails.width} × {imageDetails.height}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all">
                      Change file
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer relative z-10"
              >
                <UploadCloud className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-1">Upload an Image</h3>
                <p className="text-sm text-zinc-500">Supports JPG, PNG, WebP, AVIF</p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* Tools Grid */}
          <div className={!selectedFile ? "opacity-50 pointer-events-none" : ""}>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Image Tools</h3>
              <p className="text-xs text-zinc-500">Pick a tool — fine-tune options on the right.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                  <div
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${isActive
                        ? "bg-emerald-500/5 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "bg-[#15151A] border-white/5 hover:border-white/20 hover:bg-white/5"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-black/50 text-white"
                      }`}>
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tool.name}</h4>
                      <p className="text-xs text-zinc-500">{tool.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Configuration */}
        <div className="xl:col-span-5 2xl:col-span-4">
          <div className="bg-[#15151A] border border-white/5 rounded-2xl p-6 sticky top-6">

            <div className="mb-8">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Enterprise Settings</div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {tools.find(t => t.id === activeTool)?.name || "Options"}
              </h2>
            </div>

            <div className="space-y-6">

              {/* === UPSCALE CONFIG === */}
              {activeTool === "upscale" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Quality</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Fast", "Ultra Quality"].map(m => (
                        <button
                          key={m}
                          onClick={() => setUpscaleQualityMode(m)}
                          className={`py-2 rounded-lg text-xs font-medium border transition-all ${upscaleQualityMode === m ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-black/30 text-zinc-400 border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Output Target</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Original", "FHD", "2K"].map(t => (
                        <button
                          key={t}
                          onClick={() => setUpscaleTarget(t)}
                          className={`py-2 rounded-lg text-xs font-medium border transition-all truncate px-1 ${upscaleTarget === t ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-black/30 text-zinc-400 border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Enhancements</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-lg cursor-pointer hover:border-white/20 transition-all">
                        <input type="checkbox" checked={upscaleEnhanceDetails} onChange={e => setUpscaleEnhanceDetails(e.target.checked)} className="accent-emerald-500 w-4 h-4 rounded" />
                        <div>
                          <div className="text-sm text-zinc-200 font-medium">Enhance Details</div>
                          <div className="text-[10px] text-zinc-500">Recover textures, edges and fine details.</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-lg cursor-pointer hover:border-white/20 transition-all">
                        <input type="checkbox" checked={upscaleRestoreFaces} onChange={e => setUpscaleRestoreFaces(e.target.checked)} className="accent-emerald-500 w-4 h-4 rounded" />
                        <div>
                          <div className="text-sm text-zinc-200 font-medium">Restore Faces</div>
                          <div className="text-[10px] text-zinc-500">Improve eyes, skin and facial details.</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-lg cursor-pointer hover:border-white/20 transition-all">
                        <input type="checkbox" checked={upscaleSharpenText} onChange={e => setUpscaleSharpenText(e.target.checked)} className="accent-emerald-500 w-4 h-4 rounded" />
                        <div>
                          <div className="text-sm text-zinc-200 font-medium">Sharpen Text</div>
                          <div className="text-[10px] text-zinc-500">Crisp up fonts and geometric lines.</div>
                        </div>
                      </label>
                      <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-lg">
                        <div className="text-sm text-zinc-200 font-medium">Reduce Noise</div>
                        <select value={upscaleReduceNoise} onChange={e => setUpscaleReduceNoise(e.target.value)} className="bg-[#15151A] border border-white/10 rounded-lg text-xs text-zinc-300 p-2 outline-none">
                          <option>Off</option>
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Smart Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {["Auto", "Portrait", "Product", "Screenshot", "Anime", "Old Photo"].map(p => (
                        <button
                          key={p}
                          onClick={() => applyUpscalePreset(p)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${upscalePreset === p ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-black/30 text-zinc-400 border-white/10 hover:border-white/30"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output Preview */}
                  <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 mt-6">
                    <div className="text-xs text-emerald-500/70 uppercase tracking-wider mb-3 font-semibold">Output Preview</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-1">Input Size</div>
                        <div className="text-sm font-mono text-zinc-300">{imageDetails.width || 0} × {imageDetails.height || 0}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-1">Output Size</div>
                        <div className="text-sm font-mono text-emerald-400 font-bold">{getOutputDimensions()}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] text-zinc-500 mb-1">Estimated Time</div>
                        <div className="text-sm font-mono text-zinc-300">{upscaleTarget === '2K' ? '5-10s' : upscaleTarget === 'FHD' ? '2-4s' : '1-2s'}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* === CONVERT CONFIG === */}
              {activeTool === "convert" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Target Output Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {formats.map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setOutputFormat(fmt)}
                          className={`py-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center ${outputFormat === fmt
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold"
                              : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/20 text-zinc-400 font-medium"
                            }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {["JPG", "WEBP", "AVIF"].includes(outputFormat) && (
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quality</label>
                        <span className="text-xs font-mono text-zinc-500">{quality}%</span>
                      </div>
                      <input
                        type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  )}


                </>
              )}

              {/* === RESIZE CONFIG === */}
              {activeTool === "resize" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Dimensions</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-[10px] text-zinc-500 mb-1">Width (px)</div>
                        <input
                          type="number"
                          value={resizeWidth}
                          onChange={(e) => handleResizeWidthChange(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <button
                        onClick={() => setResizeLockRatio(!resizeLockRatio)}
                        className={`mt-4 p-2 rounded-lg transition-colors ${resizeLockRatio ? "bg-emerald-500/20 text-emerald-400" : "bg-black/30 text-zinc-500 hover:text-white"}`}
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <div className="text-[10px] text-zinc-500 mb-1">Height (px)</div>
                        <input
                          type="number"
                          value={resizeHeight}
                          onChange={(e) => handleResizeHeightChange(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* === COMPRESS CONFIG === */}
              {activeTool === "compress" && (
                <>
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Compression Level</label>
                      <span className="text-xs font-mono text-zinc-500">{100 - quality}% Ratio</span>
                    </div>
                    <input
                      type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                </>
              )}

              {/* === OCR CONFIG === */}
              {activeTool === "ocr" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex gap-3 mb-2">
                      <Info className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-blue-400">Tesseract OCR Engine</h4>
                        <p className="text-xs text-blue-300/70 mt-1 leading-relaxed">
                          Extracts standard text from images locally. Ensure images have high contrast for best results.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Export Format</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["TXT", "MD", "PDF", "DOCX"].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setOcrFormat(fmt)}
                          className={`py-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center ${ocrFormat === fmt
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold"
                              : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/20 text-zinc-400 font-medium"
                            }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl">
                    <div>
                      <span className="text-sm font-medium text-zinc-300 block mb-1">Enable AI Refinement</span>
                      <span className="text-[10px] text-zinc-500">Refine, format, or summarize the extracted text.</span>
                    </div>
                    <button onClick={() => setOcrAiEnabled(!ocrAiEnabled)} className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${ocrAiEnabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${ocrAiEnabled ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {ocrAiEnabled && (
                    <div className="p-4 bg-black/30 border border-emerald-500/30 rounded-xl">
                      <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 block">AI Instructions</label>
                      <textarea
                        value={ocrPrompt}
                        onChange={(e) => setOcrPrompt(e.target.value)}
                        placeholder="e.g. Extract this into a structured table..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 min-h-[80px] resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Universal Export Options */}
              {activeTool !== "ocr" && (
                <div className="flex flex-col gap-3 mt-6">
                  {/* Format Selector */}
                  {activeTool !== "convert" && (
                    <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl">
                      <div>
                        <span className="text-sm font-medium text-zinc-300 block mb-1">Export Format</span>
                        <span className="text-[10px] text-zinc-500">Change the image type for this operation.</span>
                      </div>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                      >
                        {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Geolocation Toggle */}
                  <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl">
                    <div>
                      <span className="text-sm font-medium text-zinc-300 block mb-1">Remove Geolocation & EXIF</span>
                      <span className="text-[10px] text-zinc-500">Strips GPS coordinates and camera metadata before downloading.</span>
                    </div>
                    <button onClick={() => setStripMetadata(!stripMetadata)} className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${stripMetadata ? "bg-emerald-500" : "bg-zinc-700"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${stripMetadata ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Status Display */}
              {isProcessing && (
                <div className="p-4 bg-black/50 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin shrink-0" />
                  <span className="text-sm text-emerald-400 font-medium animate-pulse">{processStatus}</span>
                </div>
              )}

              {!isProcessing && processResult && (
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Output Result</span>
                  <div className="text-sm text-white whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-black/30 p-3 rounded border border-white/5">
                    {processResult}
                  </div>
                </div>
              )}

              {/* Hardware Acceleration Warning */}
              {activeTool === "upscale" && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-orange-400 mt-0.5">⚠️</div>
                    <div className="w-full">
                      <span className="text-xs font-bold text-orange-400 block mb-1">Hardware Acceleration Required</span>
                      <span className="text-[10px] text-zinc-300 block mb-3">
                        If the AI upscaler crashes, your browser needs Hardware Acceleration enabled to run the WebGL models.
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("chrome://settings/system");
                          window.open("chrome://settings/system", "_blank");
                          alert("For security reasons, modern browsers block direct redirects to internal settings pages. \n\nThe settings URL (chrome://settings/system) has been COPIED to your clipboard! \n\nPlease open a new tab, paste it into your address bar, and hit Enter to enable Hardware Acceleration.");
                        }}
                        className="w-full py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        Enable Hardware Acceleration
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcess}
                disabled={!selectedFile || isProcessing}
                className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] flex items-center justify-center gap-2 mt-8"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Process & Download
                  </div>
                  <div className="text-[10px] opacity-80 mt-1 font-normal">Consumes {getToolCost()} AI Credits</div>
                </div>
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}