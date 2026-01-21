use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeProcess {
    pub pid: u32,
    pub tty: Option<String>,
    pub cwd: String,
    pub cpu_percent: f32,
    pub memory_mb: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionIndexEntry {
    #[serde(rename = "sessionId")]
    pub session_id: String,
    #[serde(rename = "fullPath")]
    pub full_path: String,
    #[serde(rename = "firstPrompt")]
    pub first_prompt: Option<String>,
    #[serde(rename = "messageCount")]
    pub message_count: u32,
    pub created: String,
    pub modified: String,
    #[serde(rename = "gitBranch")]
    pub git_branch: Option<String>,
    #[serde(rename = "projectPath")]
    pub project_path: String,
    #[serde(rename = "isSidechain")]
    pub is_sidechain: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SessionIndex {
    version: u32,
    entries: Vec<SessionIndexEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalLine {
    pub id: String,
    #[serde(rename = "type")]
    pub line_type: String,
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetrics {
    pub context_usage: f32,
    pub cost: f32,
    pub lines_added: u32,
    pub lines_removed: u32,
    pub tokens_in: u32,
    pub tokens_out: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeInstance {
    pub id: String,
    pub name: String,
    pub model: String,
    pub status: String,
    pub project: String,
    pub branch: String,
    pub working_directory: String,
    pub current_task: Option<String>,
    pub metrics: SessionMetrics,
    pub terminal_history: Vec<TerminalLine>,
    pub started_at: String,
    pub last_activity_at: String,
    pub pid: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct JsonlMessage {
    #[serde(rename = "type")]
    msg_type: Option<String>,
    message: Option<JsonlMessageContent>,
    timestamp: Option<String>,
    #[serde(rename = "sessionId")]
    session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct JsonlMessageContent {
    role: Option<String>,
    content: Option<serde_json::Value>,
}

pub fn get_claude_home() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude"))
}

pub fn discover_processes() -> Vec<ClaudeProcess> {
    let mut processes = Vec::new();

    // Run ps command to find claude processes
    let output = Command::new("ps")
        .args(["aux"])
        .output()
        .ok();

    if let Some(output) = output {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("claude") && !line.contains("grep") && !line.contains("Claude.app") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 11 {
                    // Check if this is actually the claude CLI (ends with "claude")
                    let command = parts.get(10).unwrap_or(&"");
                    if *command == "claude" || command.ends_with("/claude") {
                        let pid = parts.get(1).and_then(|p| p.parse().ok()).unwrap_or(0);
                        let cpu = parts.get(2).and_then(|p| p.parse().ok()).unwrap_or(0.0);
                        let mem_percent: f32 = parts.get(3).and_then(|p| p.parse().ok()).unwrap_or(0.0);
                        let tty = parts.get(6).map(|s| s.to_string());

                        // Get working directory using lsof
                        let cwd = get_process_cwd(pid).unwrap_or_default();

                        if !cwd.is_empty() {
                            processes.push(ClaudeProcess {
                                pid,
                                tty: if tty.as_deref() == Some("??") { None } else { tty },
                                cwd,
                                cpu_percent: cpu,
                                memory_mb: mem_percent * 100.0, // Approximate
                            });
                        }
                    }
                }
            }
        }
    }

    processes
}

fn get_process_cwd(pid: u32) -> Option<String> {
    let output = Command::new("lsof")
        .args(["-p", &pid.to_string()])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        if line.contains("cwd") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 9 {
                return Some(parts[8..].join(" "));
            }
        }
    }
    None
}

pub fn get_all_sessions() -> Vec<SessionIndexEntry> {
    let mut all_sessions = Vec::new();

    let claude_home = match get_claude_home() {
        Some(h) => h,
        None => return all_sessions,
    };

    let projects_dir = claude_home.join("projects");
    if !projects_dir.exists() {
        return all_sessions;
    }

    // Iterate through all project directories
    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                let index_file = path.join("sessions-index.json");
                if index_file.exists() {
                    if let Ok(content) = fs::read_to_string(&index_file) {
                        if let Ok(index) = serde_json::from_str::<SessionIndex>(&content) {
                            all_sessions.extend(index.entries);
                        }
                    }
                }
            }
        }
    }

    // Sort by modified date descending
    all_sessions.sort_by(|a, b| b.modified.cmp(&a.modified));
    all_sessions
}

pub fn get_session_history(session_path: &str, limit: usize) -> Vec<TerminalLine> {
    let mut history = Vec::new();
    let path = PathBuf::from(session_path);

    if !path.exists() {
        return history;
    }

    let file = match fs::File::open(&path) {
        Ok(f) => f,
        Err(_) => return history,
    };

    let reader = BufReader::new(file);
    let mut line_id = 0;

    for line in reader.lines().filter_map(|l| l.ok()) {
        if let Ok(msg) = serde_json::from_str::<JsonlMessage>(&line) {
            if let Some(message) = msg.message {
                let content = match message.content {
                    Some(serde_json::Value::String(s)) => s,
                    Some(serde_json::Value::Array(arr)) => {
                        arr.iter()
                            .filter_map(|v| {
                                if let serde_json::Value::Object(obj) = v {
                                    if obj.get("type").and_then(|t| t.as_str()) == Some("text") {
                                        return obj.get("text").and_then(|t| t.as_str()).map(|s| s.to_string());
                                    }
                                }
                                None
                            })
                            .collect::<Vec<_>>()
                            .join("\n")
                    }
                    _ => continue,
                };

                // Skip meta messages and empty content
                if content.is_empty() || content.starts_with("<local-command") {
                    continue;
                }

                let line_type = match message.role.as_deref() {
                    Some("user") => "input",
                    Some("assistant") => "output",
                    _ => "system",
                };

                // Truncate very long content
                let truncated_content = if content.len() > 500 {
                    format!("{}...", &content[..500])
                } else {
                    content
                };

                history.push(TerminalLine {
                    id: format!("line-{}", line_id),
                    line_type: line_type.to_string(),
                    content: truncated_content,
                    timestamp: msg.timestamp.unwrap_or_default(),
                });
                line_id += 1;
            }
        }
    }

    // Return last N lines
    if history.len() > limit {
        history.split_off(history.len() - limit)
    } else {
        history
    }
}

fn path_to_project_key(path: &str) -> String {
    path.replace("/", "-")
}

pub fn get_instances() -> Vec<ClaudeInstance> {
    let processes = discover_processes();
    let all_sessions = get_all_sessions();

    // Group sessions by project path
    let mut sessions_by_project: HashMap<String, Vec<SessionIndexEntry>> = HashMap::new();
    for session in all_sessions {
        sessions_by_project
            .entry(session.project_path.clone())
            .or_default()
            .push(session);
    }

    let mut instances = Vec::new();

    // Create instances for running processes
    for process in &processes {
        let project_name = PathBuf::from(&process.cwd)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        // Find the most recent session for this project
        let session = sessions_by_project
            .get(&process.cwd)
            .and_then(|sessions| sessions.first());

        let (terminal_history, first_prompt, branch) = if let Some(s) = session {
            (
                get_session_history(&s.full_path, 50),
                s.first_prompt.clone(),
                s.git_branch.clone(),
            )
        } else {
            (Vec::new(), None, None)
        };

        instances.push(ClaudeInstance {
            id: format!("proc-{}", process.pid),
            name: first_prompt
                .as_ref()
                .map(|p| {
                    if p.len() > 30 {
                        format!("{}...", &p[..30])
                    } else {
                        p.clone()
                    }
                })
                .unwrap_or_else(|| project_name.clone()),
            model: "Claude".to_string(),
            status: if process.cpu_percent > 5.0 {
                "working".to_string()
            } else {
                "idle".to_string()
            },
            project: project_name,
            branch: branch.unwrap_or_else(|| "main".to_string()),
            working_directory: process.cwd.clone(),
            current_task: first_prompt,
            metrics: SessionMetrics {
                context_usage: 0.0,
                cost: 0.0,
                lines_added: 0,
                lines_removed: 0,
                tokens_in: 0,
                tokens_out: 0,
            },
            terminal_history,
            started_at: chrono::Utc::now().to_rfc3339(),
            last_activity_at: chrono::Utc::now().to_rfc3339(),
            pid: Some(process.pid),
        });
    }

    // Add recent sessions that aren't running as "offline" instances
    for (project_path, sessions) in &sessions_by_project {
        // Skip if we already have a running process for this project
        if processes.iter().any(|p| &p.cwd == project_path) {
            continue;
        }

        // Only show the most recent 3 offline sessions per project
        for session in sessions.iter().take(1) {
            let project_name = PathBuf::from(project_path)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string());

            instances.push(ClaudeInstance {
                id: session.session_id.clone(),
                name: session
                    .first_prompt
                    .as_ref()
                    .map(|p| {
                        if p.len() > 30 {
                            format!("{}...", &p[..30])
                        } else {
                            p.clone()
                        }
                    })
                    .unwrap_or_else(|| project_name.clone()),
                model: "Claude".to_string(),
                status: "offline".to_string(),
                project: project_name,
                branch: session.git_branch.clone().unwrap_or_else(|| "main".to_string()),
                working_directory: project_path.clone(),
                current_task: session.first_prompt.clone(),
                metrics: SessionMetrics {
                    context_usage: 0.0,
                    cost: 0.0,
                    lines_added: 0,
                    lines_removed: 0,
                    tokens_in: 0,
                    tokens_out: 0,
                },
                terminal_history: Vec::new(),
                started_at: session.created.clone(),
                last_activity_at: session.modified.clone(),
                pid: None,
            });
        }
    }

    instances
}
