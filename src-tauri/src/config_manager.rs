use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
#[derive(Serialize, Deserialize)]
pub struct Config {}

// For future configuration options

pub struct ConfigManager {
    pub config_path: PathBuf,
}

impl ConfigManager {
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let mut config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;

        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

        config_dir.push("config.json");

        Ok(Self {
            config_path: config_dir,
        })
    }

    pub fn load_config(&self) -> Result<Config, String> {
        let config_file = &self.config_path;
        let config_data = std::fs::read_to_string(config_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&config_data).map_err(|e| e.to_string())
    }

    pub fn save_config(&self, config: &Config) -> Result<(), String> {
        let config_file = &self.config_path;
        let config_data = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
        std::fs::write(config_file, config_data).map_err(|e| e.to_string())
    }
}
