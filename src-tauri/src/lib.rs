mod claude;

use claude::{ClaudeInstance, get_instances, get_session_history, TerminalLine};
use std::process::Command;

#[tauri::command]
fn get_claude_instances() -> Vec<ClaudeInstance> {
    get_instances()
}

#[tauri::command]
fn get_instance_history(session_path: String, limit: usize) -> Vec<TerminalLine> {
    get_session_history(&session_path, limit)
}

#[tauri::command]
fn refresh_instances() -> Vec<ClaudeInstance> {
    get_instances()
}

#[tauri::command]
fn open_in_terminal(working_directory: String, session_id: Option<String>) -> Result<(), String> {
    // Build the claude command - resume session if we have a session ID
    let claude_cmd = if let Some(sid) = session_id {
        format!("cd '{}' && claude --resume '{}'", working_directory, sid)
    } else {
        format!("cd '{}' && claude", working_directory)
    };

    // Use AppleScript to open Terminal and run the command
    let script = format!(
        r#"tell application "Terminal"
            activate
            do script "{}"
        end tell"#,
        claude_cmd.replace("\"", "\\\"")
    );

    Command::new("osascript")
        .args(["-e", &script])
        .spawn()
        .map_err(|e| format!("Failed to open terminal: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_claude_instances,
            get_instance_history,
            refresh_instances,
            open_in_terminal
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
