// vite.config.ts
import { defineConfig } from "file:///C:/Users/varun/.gemini/antigravity-ide/scratch/genworkai/apps/extension/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/varun/.gemini/antigravity-ide/scratch/genworkai/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///C:/Users/varun/.gemini/antigravity-ide/scratch/genworkai/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "GenWorkAI - Browser Intelligence",
  version: "1.0.0",
  description: "Transform any webpage into knowledge, documents, and AI context.",
  permissions: ["activeTab", "scripting", "storage", "downloads", "sidePanel", "tabs"],
  host_permissions: ["<all_urls>"],
  action: {},
  side_panel: {
    default_path: "index.html"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"]
    }
  ]
};

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  build: {
    rollupOptions: {
      input: {
        side_panel: "index.html"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHZhcnVuXFxcXC5nZW1pbmlcXFxcYW50aWdyYXZpdHktaWRlXFxcXHNjcmF0Y2hcXFxcZ2Vud29ya2FpXFxcXGFwcHNcXFxcZXh0ZW5zaW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx2YXJ1blxcXFwuZ2VtaW5pXFxcXGFudGlncmF2aXR5LWlkZVxcXFxzY3JhdGNoXFxcXGdlbndvcmthaVxcXFxhcHBzXFxcXGV4dGVuc2lvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdmFydW4vLmdlbWluaS9hbnRpZ3Jhdml0eS1pZGUvc2NyYXRjaC9nZW53b3JrYWkvYXBwcy9leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuanNvbic7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBjcngoeyBtYW5pZmVzdDogbWFuaWZlc3QgYXMgYW55IH0pLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgc2lkZV9wYW5lbDogJ2luZGV4Lmh0bWwnLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSBhcyBhbnkpO1xuIiwgIntcbiAgXCJtYW5pZmVzdF92ZXJzaW9uXCI6IDMsXG4gIFwibmFtZVwiOiBcIkdlbldvcmtBSSAtIEJyb3dzZXIgSW50ZWxsaWdlbmNlXCIsXG4gIFwidmVyc2lvblwiOiBcIjEuMC4wXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJUcmFuc2Zvcm0gYW55IHdlYnBhZ2UgaW50byBrbm93bGVkZ2UsIGRvY3VtZW50cywgYW5kIEFJIGNvbnRleHQuXCIsXG4gIFwicGVybWlzc2lvbnNcIjogW1wiYWN0aXZlVGFiXCIsIFwic2NyaXB0aW5nXCIsIFwic3RvcmFnZVwiLCBcImRvd25sb2Fkc1wiLCBcInNpZGVQYW5lbFwiLCBcInRhYnNcIl0sXG4gIFwiaG9zdF9wZXJtaXNzaW9uc1wiOiBbXCI8YWxsX3VybHM+XCJdLFxuICBcImFjdGlvblwiOiB7fSxcbiAgXCJzaWRlX3BhbmVsXCI6IHtcbiAgICBcImRlZmF1bHRfcGF0aFwiOiBcImluZGV4Lmh0bWxcIlxuICB9LFxuICBcImJhY2tncm91bmRcIjoge1xuICAgIFwic2VydmljZV93b3JrZXJcIjogXCJzcmMvYmFja2dyb3VuZC9pbmRleC50c1wiLFxuICAgIFwidHlwZVwiOiBcIm1vZHVsZVwiXG4gIH0sXG4gIFwiY29udGVudF9zY3JpcHRzXCI6IFtcbiAgICB7XG4gICAgICBcIm1hdGNoZXNcIjogW1wiPGFsbF91cmxzPlwiXSxcbiAgICAgIFwianNcIjogW1wic3JjL2NvbnRlbnQvaW5kZXgudHNcIl1cbiAgICB9XG4gIF1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVosU0FBUyxvQkFBb0I7QUFDdGIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsV0FBVzs7O0FDRnBCO0FBQUEsRUFDRSxrQkFBb0I7QUFBQSxFQUNwQixNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixhQUFlLENBQUMsYUFBYSxhQUFhLFdBQVcsYUFBYSxhQUFhLE1BQU07QUFBQSxFQUNyRixrQkFBb0IsQ0FBQyxZQUFZO0FBQUEsRUFDakMsUUFBVSxDQUFDO0FBQUEsRUFDWCxZQUFjO0FBQUEsSUFDWixjQUFnQjtBQUFBLEVBQ2xCO0FBQUEsRUFDQSxZQUFjO0FBQUEsSUFDWixnQkFBa0I7QUFBQSxJQUNsQixNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakI7QUFBQSxNQUNFLFNBQVcsQ0FBQyxZQUFZO0FBQUEsTUFDeEIsSUFBTSxDQUFDLHNCQUFzQjtBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUNGOzs7QURmQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixJQUFJLEVBQUUsVUFBVSxpQkFBZ0IsQ0FBQztBQUFBLEVBQ25DO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLFlBQVk7QUFBQSxNQUNkO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
