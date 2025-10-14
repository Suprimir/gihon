use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO Error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON Error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Tauri Error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("File not found: {path}")]
    FileNotFound { path: String },

    #[error("{message}")]
    General { message: String },
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
