use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

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

#[allow(dead_code)]
struct ServerSidecar(Mutex<Option<CommandChild>>);

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

/// Poll TCP port until it accepts connections (max 30 s).
fn wait_for_port(port: u16) {
    let addr: std::net::SocketAddr = format!("127.0.0.1:{port}").parse().unwrap();
    for _ in 0..150 {
        if TcpStream::connect_timeout(&addr, Duration::from_millis(100)).is_ok() {
            return;
        }
        std::thread::sleep(Duration::from_millis(200));
    }
    eprintln!("Warning: gSender server did not respond on port {port} within 30 s");
}

#[tauri::command]
fn set_host(app: AppHandle, host: String) -> Result<(), String> {
    let config = PendantConfig { host: host.clone() };
    save_config(&app, &config);
    if let Some(win) = app.get_webview_window("main") {
        let url = pendant_url(&host);
        win.navigate(url.parse().map_err(|e| format!("Invalid URL: {e}"))?)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_host(app: AppHandle) -> String {
    load_config(&app).host
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Spawn the bundled gSender server sidecar
            let (mut rx, child) = app.shell()
                .sidecar("gsender-server")?
                .args(["-p", "8000"])
                .spawn()?;

            // Drain stdout/stderr in background so the pipe never stalls the server
            tauri::async_runtime::spawn(async move {
                while let Some(_event) = rx.recv().await {}
            });

            // Keep child alive for the lifetime of the app
            app.manage(ServerSidecar(Mutex::new(Some(child))));

            // Block until server is accepting connections, then open the window
            wait_for_port(8000);

            let config = load_config(app.handle());
            let url = pendant_url(&config.host);

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.parse()?))
                .title("gSender Pendant")
                .inner_size(768.0, 1024.0)
                .min_inner_size(768.0, 1024.0)
                .decorations(false)
                .resizable(true)
                .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_host, get_host])
        .run(tauri::generate_context!())
        .expect("Error running gSender Pendant");
}
