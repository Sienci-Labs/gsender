use std::fs;
use std::io::Write as IoWrite;
use std::net::TcpStream;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

const CONFIG_FILE: &str = "pendant-config.json";
const DEFAULT_HOST: &str = "127.0.0.1:8000";

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PendantConfig {
    host: String,
}

#[derive(Debug, Clone, Serialize)]
struct GcodeFilePayload {
    path: String,
    name: String,
    size: u64,
    content: String,
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

// --- Logging to ~/Library/Logs/gSender Pendant/startup.log ---
// eprintln! is invisible when launched from Finder; the log file persists.

fn log_path() -> PathBuf {
    let dir = dirs::home_dir()
        .unwrap_or_default()
        .join("Library/Logs/gSender Pendant");
    let _ = fs::create_dir_all(&dir);
    dir.join("startup.log")
}

fn tlog(msg: &str) {
    eprintln!("{msg}");
    if let Ok(mut f) = fs::OpenOptions::new().create(true).append(true).open(log_path()) {
        let _ = writeln!(f, "{msg}");
    }
}

macro_rules! tlog {
    ($($arg:tt)*) => { tlog(&format!($($arg)*)) };
}

// --- Config helpers ---

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
    // Trailing slash is required so that relative asset URLs (./assets/...) in
    // the Vite-built index.html resolve to /pendant/assets/... not /assets/...
    format!("http://{}/pendant/", host)
}

/// Returns true if nothing is currently listening on the port.
fn is_port_free(port: u16) -> bool {
    let addr: std::net::SocketAddr = format!("127.0.0.1:{port}").parse().unwrap();
    TcpStream::connect_timeout(&addr, Duration::from_millis(100)).is_err()
}

/// Poll TCP port until it accepts connections (max 30 s). Returns true if ready.
fn wait_for_port(port: u16) -> bool {
    tlog!("[tauri] polling port {port}...");
    let addr: std::net::SocketAddr = format!("127.0.0.1:{port}").parse().unwrap();
    for i in 0..150 {
        if TcpStream::connect_timeout(&addr, Duration::from_millis(100)).is_ok() {
            tlog!("[tauri] port {port} ready after ~{} ms", i * 200);
            return true;
        }
        std::thread::sleep(Duration::from_millis(200));
    }
    tlog!("[tauri] ERROR: port {port} did not respond within 30 s — sidecar likely crashed");
    false
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

fn read_gcode_payload(path: PathBuf) -> Result<GcodeFilePayload, String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let content = String::from_utf8_lossy(&bytes).to_string();
    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("file.gcode")
        .to_string();

    Ok(GcodeFilePayload {
        path: path.to_string_lossy().to_string(),
        name,
        size: metadata.len(),
        content,
    })
}

#[tauri::command]
fn pick_gcode_file() -> Result<Option<GcodeFilePayload>, String> {
    let picked = rfd::FileDialog::new()
        .add_filter("G-code", &["gcode", "nc", "tap", "cnc", "g", "gc"])
        .pick_file();

    match picked {
        Some(path) => read_gcode_payload(path).map(Some),
        None => Ok(None),
    }
}

#[tauri::command]
fn read_gcode_file(path: String) -> Result<GcodeFilePayload, String> {
    read_gcode_payload(PathBuf::from(path))
}

pub fn run() {
    // Truncate the log file on each fresh launch
    let _ = fs::write(log_path(), "");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tlog!("[tauri] setup — spawning gSender server sidecar");
            tlog!("[tauri] log file: {}", log_path().display());

            // Resolve pendant SPA path.
            // Production (all platforms): use Tauri's resource_dir() which returns
            //   Contents/Resources on macOS, /usr/lib/<id>/ on Linux deb, etc.
            // Dev fallback: binaries/pendant/ next to src-tauri/ in the workspace.
            let pendant_spa_path: Option<std::path::PathBuf> = {
                let from_resources = app.path().resource_dir()
                    .ok()
                    .map(|d| d.join("pendant"))
                    .filter(|p| p.join("index.html").exists());

                if from_resources.is_some() {
                    from_resources
                } else {
                    std::env::current_exe().ok().and_then(|exe| {
                        // exe = …/src-tauri/target/debug/gsender-pendant → parent×3 = …/src-tauri/
                        let dev = exe.parent()?.parent()?.parent()?.join("binaries/pendant");
                        if dev.join("index.html").exists() { Some(dev) } else { None }
                    })
                }
            };
            if let Some(ref p) = pendant_spa_path {
                tlog!("[tauri] pendant SPA path: {}", p.display());
            } else {
                tlog!("[tauri] pendant SPA path: not found — server will use default");
            }

            let sidecar_child: Option<CommandChild> = if is_port_free(8000) {
                let mut cmd = app.shell()
                    .sidecar("gsender-server")?
                    .args(["-p", "8000"]);
                if let Some(ref p) = pendant_spa_path {
                    cmd = cmd.env("GSENDER_PENDANT_PATH", p);
                }
                let (mut rx, child) = cmd.spawn()?;

                tlog!("[tauri] sidecar spawned OK");

                // Log all sidecar output — written to both stderr AND the log file
                tauri::async_runtime::spawn(async move {
                    while let Some(event) = rx.recv().await {
                        match event {
                            CommandEvent::Stdout(line) =>
                                tlog!("[sidecar] {}", String::from_utf8_lossy(&line)),
                            CommandEvent::Stderr(line) =>
                                tlog!("[sidecar:err] {}", String::from_utf8_lossy(&line)),
                            CommandEvent::Error(e) =>
                                tlog!("[sidecar:spawn-error] {e}"),
                            CommandEvent::Terminated(s) =>
                                tlog!("[sidecar:exit] code={:?} signal={:?}", s.code, s.signal),
                            _ => {}
                        }
                    }
                });

                Some(child)
            } else {
                tlog!("[tauri] port 8000 already in use — skipping sidecar, using existing server");
                None
            };

            app.manage(ServerSidecar(Mutex::new(sidecar_child)));

            let ready = wait_for_port(8000);
            let config = load_config(app.handle());
            let url = if ready {
                tlog!("[tauri] opening webview at {}", pendant_url(&config.host));
                pendant_url(&config.host)
            } else {
                tlog!("[tauri] server never ready — showing error page");
                format!(
                    "data:text/html,<body style='font-family:sans-serif;padding:2rem'>\
                    <h2>gSender server failed to start</h2>\
                    <p>Check the log file for details:</p>\
                    <pre style='background:#f3f4f6;padding:1rem;border-radius:4px'>\
                    {}</pre></body>",
                    log_path().display()
                )
            };

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.parse()?))
                .title("gSender Pendant")
                .inner_size(768.0, 1024.0)
                .min_inner_size(768.0, 1024.0)
                .decorations(false)
                .resizable(true)
                .devtools(true)
                .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_host,
            get_host,
            pick_gcode_file,
            read_gcode_file
        ])
        .run(tauri::generate_context!())
        .expect("Error running gSender Pendant");
}
