require("dotenv").config();
const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

// Function to load configuration
function loadSupabaseConfig() {
  let config = {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || ""
  };

  // Try to load from config file (for production)
  try {
    const configPaths = [
      path.join(__dirname, 'config.json'), // Development
      path.join(process.resourcesPath, 'app', 'config.json'), // Production
      path.join(process.resourcesPath, 'config.json'), // Alternative production path
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        console.log("📁 Found config file at:", configPath);
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (fileConfig.SUPABASE_URL && !config.url) {
          config.url = fileConfig.SUPABASE_URL;
        }
        if (fileConfig.SUPABASE_ANON_KEY && !config.anonKey) {
          config.anonKey = fileConfig.SUPABASE_ANON_KEY;
        }
        break;
      }
    }
  } catch (error) {
    console.error("❌ Error loading config file:", error);
  }

  console.log("🔐 Final Supabase Config:");
  console.log("URL:", config.url ? "✅ LOADED" : "❌ MISSING");
  console.log("Key:", config.anonKey ? "✅ LOADED" : "❌ MISSING");

  return config;
}

const supabaseConfig = loadSupabaseConfig();

const createWindow = () => {
  const preloadPath = path.resolve(__dirname, "preload.js");

  console.log("📁 Preload path:", preloadPath);
  console.log("📁 File exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      preload: preloadPath,
      sandbox: false,
    },
  });

  // Hide the top menu bar
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Right-click context menu with Reload + Inspect Element
  mainWindow.webContents.on("context-menu", (e, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Reload",
        accelerator: "CmdOrCtrl+R",
        click: () => mainWindow.reload(),
      },
      {
        label: "Inspect Element",
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
          if (!mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.openDevTools();
          }
        },
      },
    ]);
    contextMenu.popup({ window: mainWindow });
  });

  // Load your login page
  const loginPagePath = path.join(__dirname, "src", "renderer", "Pages", "Auth", "LoginPage.html");
  console.log("Loading login page from:", loginPagePath);

  if (fs.existsSync(loginPagePath)) {
    mainWindow
      .loadFile(loginPagePath)
      .then(() => console.log("Login page loaded successfully"))
      .catch((err) => console.error(" Error loading login page:", err));
  } else {
    console.error("Login page not found");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });
};

// App lifecycle
app.whenReady().then(() => {
  console.log("Electron app starting...");
  createWindow();
});

app.on("window-all-closed", () => {
  console.log(" windows closed - quitting app");
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-platform", () => process.platform);

// Supabase configuration IPC handler
ipcMain.handle("get-supabase-config", () => {
  console.log("📡 IPC: Providing Supabase config to renderer");
  return supabaseConfig;
});