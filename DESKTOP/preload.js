// ================================================
// SIMPLIFIED preload.js
// ================================================

console.log("🚀 PRODUCTION Preload.js - Starting execution");

const { contextBridge, ipcRenderer } = require("electron");

// Initialize configuration
let supabaseConfig = {
  url: '',
  anonKey: '',
  isConfigured: false
};

async function loadConfig() {
  try {
    console.log("🔄 Loading configuration...");
    
    // Try IPC first
    const config = await ipcRenderer.invoke('get-supabase-config');
    
    if (config && config.url && config.anonKey) {
      supabaseConfig.url = config.url;
      supabaseConfig.anonKey = config.anonKey;
      supabaseConfig.isConfigured = true;
      console.log("✅ Configuration loaded via IPC");
      console.log("URL:", config.url);
      console.log("Key Length:", config.anonKey.length);
    } else {
      console.log("❌ No configuration available");
    }
  } catch (error) {
    console.error("❌ Error loading configuration:", error);
  }
}

// Load config and expose APIs
loadConfig().then(() => {
  try {
    // Expose to renderer
    contextBridge.exposeInMainWorld('supabaseConfig', supabaseConfig);

    contextBridge.exposeInMainWorld('electronAPI', {
      getSupabaseConfig: () => supabaseConfig,
      getEnvironment: () => ({
        isProduction: true,
        hasConfig: supabaseConfig.isConfigured
      }),
      test: () => 'Preload script is working!'
    });

    console.log("✅ APIs exposed successfully");
    console.log("📤 supabaseConfig.isConfigured:", supabaseConfig.isConfigured);

  } catch (error) {
    console.error("💥 Error exposing APIs:", error);
  }
});

console.log("🎯 Preload.js setup completed");