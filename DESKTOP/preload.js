// ================================================
// FIXED preload.js - Handles lowercase arguments
// ================================================

console.log("FIXED Preload.js - Starting execution");

const { contextBridge } = require("electron");

try {
  console.log("Attempting to expose APIs...");
  
  // Get ALL arguments for debugging
  const args = process.argv;
  console.log("Total arguments:", args.length);
  
  // Debug: Show all arguments that might contain supabase
  const supabaseArgs = args.filter(arg => arg.toLowerCase().includes('supabase'));
  console.log("Supabase-related arguments:", supabaseArgs);
  
  // Look for Supabase credentials in arguments (handle lowercase)
  let supabaseUrl, supabaseAnonKey;
  
  // Check all possible argument name variations
  for (const arg of args) {
    const lowerArg = arg.toLowerCase();
    
    if (lowerArg.startsWith('--supabaseurl=')) {
      supabaseUrl = arg.split('=')[1];
    }
    else if (lowerArg.startsWith('--supabaseanonkey=')) {
      supabaseAnonKey = arg.split('=')[1];
    }
    else if (lowerArg.startsWith('--supabase-url=')) {
      supabaseUrl = arg.split('=')[1];
    }
    else if (lowerArg.startsWith('--supabase-anon-key=')) {
      supabaseAnonKey = arg.split('=')[1];
    }
    else if (lowerArg.startsWith('--supabaseurl=')) {
      supabaseUrl = arg.split('=')[1];
    }
    else if (lowerArg.startsWith('--supabaseanonkey=')) {
      supabaseAnonKey = arg.split('=')[1];
    }
  }
  
  console.log("Supabase URL found:", supabaseUrl ? "YES" : "NO");
  console.log("Supabase Key found:", supabaseAnonKey ? "YES" : "NO");
  
  if (supabaseUrl) {
    console.log("Supabase URL:", supabaseUrl);
  }
  if (supabaseAnonKey) {
    console.log("Supabase Key: [HIDDEN FOR SECURITY - Length:", supabaseAnonKey.length + "]");
  }
  
  const finalUrl = supabaseUrl || '';
  const finalKey = supabaseAnonKey || '';
  
  console.log("Final URL to use:", finalUrl ? "SET" : "EMPTY");
  console.log("Final Key to use:", finalKey ? "SET" : "EMPTY");

  // Expose Supabase configuration
  contextBridge.exposeInMainWorld('supabaseConfig', {
    url: finalUrl,
    anonKey: finalKey,
    isConfigured: !!(finalUrl && finalKey)
  });
  
  // Enhanced electronAPI
  contextBridge.exposeInMainWorld('electronAPI', {
    test: () => 'Hello from fixed preload!',
    environment: {
      preloadLoaded: true,
      timestamp: new Date().toISOString(),
      argsCount: args.length,
      hasSupabaseConfig: !!(finalUrl && finalKey),
      supabaseUrl: finalUrl,
      supabaseKeyLength: finalKey.length
    },
    // Helper to get config
    getConfig: () => ({
      url: finalUrl,
      anonKey: finalKey,
      isConfigured: !!(finalUrl && finalKey)
    })
  });
  
  console.log("ContextBridge exposure successful");
  
} catch (error) {
  console.error("CRITICAL ERROR in preload:", error);
}

console.log("FIXED Preload.js execution completed");