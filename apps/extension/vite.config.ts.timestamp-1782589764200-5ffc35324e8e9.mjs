// vite.config.ts
import { defineConfig } from "file:///C:/Users/varun/.gemini/antigravity-ide/scratch/genworkai/apps/extension/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/varun/.gemini/antigravity-ide/scratch/genworkai/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\Users\\varun\\.gemini\\antigravity-ide\\scratch\\genworkai\\apps\\extension";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html"),
        background: resolve(__vite_injected_original_dirname, "src/background/index.ts"),
        content: resolve(__vite_injected_original_dirname, "src/content/index.ts")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "content") return "content.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx2YXJ1blxcXFwuZ2VtaW5pXFxcXGFudGlncmF2aXR5LWlkZVxcXFxzY3JhdGNoXFxcXGdlbndvcmthaVxcXFxhcHBzXFxcXGV4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdmFydW5cXFxcLmdlbWluaVxcXFxhbnRpZ3Jhdml0eS1pZGVcXFxcc2NyYXRjaFxcXFxnZW53b3JrYWlcXFxcYXBwc1xcXFxleHRlbnNpb25cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3ZhcnVuLy5nZW1pbmkvYW50aWdyYXZpdHktaWRlL3NjcmF0Y2gvZ2Vud29ya2FpL2FwcHMvZXh0ZW5zaW9uL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICAgIGJhY2tncm91bmQ6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2JhY2tncm91bmQvaW5kZXgudHMnKSxcbiAgICAgICAgY29udGVudDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvY29udGVudC9pbmRleC50cycpLFxuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBlbnRyeUZpbGVOYW1lczogKGNodW5rSW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGNodW5rSW5mby5uYW1lID09PSAnYmFja2dyb3VuZCcpIHJldHVybiAnYmFja2dyb3VuZC5qcyc7XG4gICAgICAgICAgaWYgKGNodW5rSW5mby5uYW1lID09PSAnY29udGVudCcpIHJldHVybiAnY29udGVudC5qcyc7XG4gICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcyc7XG4gICAgICAgIH0sXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0gYXMgYW55KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVosU0FBUyxvQkFBb0I7QUFDdGIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUZ4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUNyQyxZQUFZLFFBQVEsa0NBQVcseUJBQXlCO0FBQUEsUUFDeEQsU0FBUyxRQUFRLGtDQUFXLHNCQUFzQjtBQUFBLE1BQ3BEO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixnQkFBZ0IsQ0FBQyxjQUFtQjtBQUNsQyxjQUFJLFVBQVUsU0FBUyxhQUFjLFFBQU87QUFDNUMsY0FBSSxVQUFVLFNBQVMsVUFBVyxRQUFPO0FBQ3pDLGlCQUFPO0FBQUEsUUFDVDtBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
