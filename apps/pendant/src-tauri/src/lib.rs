use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const CONFIG_FILE: &str = "pendant-config.json";
const DEFAULT_HOST: &str = "127.0.0.1:8000";

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PendantConfig {
    host: String,
}

impl Default for PendantConfig {
    fn default() -> Self {
        Self {
            host: DEFAULT_HOST.to_string(),
        }
    }
}

fn config_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to resolve app data dir")
        .join(CONFIG_FILE)
}

fn load_config(app: &AppHandle) -> PendantConfig {
    let path = config_path(app);
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_config(app: &AppHandle, config: &PendantConfig) {
    let path = config_path(app);
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(&path, serde_json::to_string_pretty(config).unwrap_or_default());
}

fn pendant_url(host: &str) -> String {
    format!("http://{}/pendant", host)
}

/// Exposed to the pendant web UI via Tauri's invoke bridge.
/// Called when the user changes the gSender host in the UI.
#[tauri::command]
fn set_host(app: AppHandle, host: String) -> Result<(), String> {
    let config = PendantConfig { host: host.clone() };
    save_config(&app, &config);

    // Navigate the main window to the new host
    if let Some(win) = app.get_webview_window("main") {
        let url = pendant_url(&host);
        win.navigate(url.parse().map_err(|e| format!("Invalid URL: {e}"))?)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Returns the currently stored host so the UI can display it.
#[tauri::command]
fn get_host(app: AppHandle) -> String {
    load_config(&app).host
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let config = load_config(app.handle());
            let url = pendant_url(&config.host);

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.parse()?))
                .title("gSender Pendant")
                .inner_size(1024.0, 768.0)
                .min_inner_size(800.0, 600.0)
                .decorations(false)
                .resizable(true)
                .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_host, get_host])
        .run(tauri::generate_context!())
        .expect("Error running gSender Pendant");
}
