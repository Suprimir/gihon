use crate::cbz_viewer::{CbzViewer, ComicInfo};
use crate::config_manager::{Config, ConfigManager};
use crate::errors::AppError;
use crate::file_manager::FileManager;
use base64::engine::general_purpose;
use base64::Engine;
use log::{error, info, warn};
use std::fs;
use std::path::Path;
use tauri::command;

#[command]
pub async fn list_files(app_handle: tauri::AppHandle) -> Result<Vec<String>, AppError> {
    info!("Listing files...");

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General {
        message: format!("Error starting FileManager {}", e),
    })?;

    match fm.list_files() {
        Ok(files) => {
            info!("Listed {} files", files.len());
            Ok(files)
        }
        Err(e) => {
            error!("Error listing files: {}", e);
            Err(AppError::General {
                message: format!("Error listing files: {}", e),
            })
        }
    }
}

#[command]
pub fn add_file(app_handle: tauri::AppHandle, source_path: String) -> Result<(), AppError> {
    info!("Adding file: {}", source_path);

    if !Path::new(&source_path).exists() {
        warn!("File does not exist: {}", source_path);
        return Err(AppError::FileNotFound { path: source_path });
    }

    let source_path_lower = source_path.to_lowercase();
    if !(source_path_lower.ends_with(".cbz")
        || source_path_lower.ends_with(".cbr")
        || source_path_lower.ends_with(".zip")
        || source_path_lower.ends_with(".rar"))
    {
        warn!("Unsupported file format: {}", source_path);
        return Err(AppError::General {
            message: format!("Unsupported file format: {}", source_path),
        });
    }

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General {
        message: format!("Error starting FileManager: {}", e),
    })?;

    match fm.add_file(&source_path) {
        Ok(_) => {
            info!("File added successfully");
            Ok(())
        }
        Err(e) => {
            error!("Error adding file: {}", e);
            Err(AppError::General {
                message: format!("Error adding file: {}", e),
            })
        }
    }
}

#[command]
pub fn load_config(app_handle: tauri::AppHandle) -> Result<Config, AppError> {
    info!("Loading configuration...");

    let cm = ConfigManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;
    cm.load_config()
        .map_err(|e| AppError::General { message: e })
}

#[command]
pub fn save_config(app_handle: tauri::AppHandle, config: Config) -> Result<(), AppError> {
    info!("Saving configuration...");
    let cm = ConfigManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;
    cm.save_config(&config)
        .map_err(|e| AppError::General { message: e })
}

#[command]
pub fn read_comic_info(
    app_handle: tauri::AppHandle,
    cbz_path: String,
) -> Result<ComicInfo, AppError> {
    info!("Reading comic info from: {}", cbz_path);

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;
    let full_path = fm
        .get_full_path(&cbz_path)
        .map_err(|e| AppError::General { message: e })?
        .to_str()
        .ok_or_else(|| AppError::General {
            message: format!("Invalid path for {}", cbz_path),
        })?
        .to_string();
    CbzViewer::read_comic_info(&full_path).map_err(|e| AppError::General { message: e })
}

#[command]
pub fn get_metadata(app_handle: tauri::AppHandle, cbz_path: String) -> Result<ComicInfo, AppError> {
    info!("Getting metadata for: {}", cbz_path);

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;

    let file_stem = std::path::Path::new(&cbz_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| AppError::General {
            message: format!("Invalid file name: {}", cbz_path),
        })?;

    let metadata_file = fm.directory.join(file_stem).join("metadata.json");
    let comic_info = if metadata_file.exists() {
        let metadata_data =
            std::fs::read_to_string(&metadata_file).map_err(|e| AppError::General {
                message: format!("Failed to read metadata: {}", e),
            })?;
        serde_json::from_str::<ComicInfo>(&metadata_data).map_err(|e| AppError::General {
            message: format!("Failed to parse metadata: {}", e),
        })?
    } else {
        let full_path = fm
            .get_full_path(&cbz_path)
            .map_err(|e| AppError::General { message: e })?;
        let path_str = full_path.to_str().ok_or_else(|| AppError::General {
            message: format!("Invalid path for {}", cbz_path),
        })?;
        CbzViewer::read_comic_info(path_str).map_err(|e| AppError::General { message: e })?
    };

    Ok(comic_info)
}

#[command]
pub fn get_cover_image(
    app_handle: tauri::AppHandle,
    cbz_path: String,
) -> Result<Option<String>, AppError> {
    info!("Getting cover image for: {}", cbz_path);

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;

    let file_stem = std::path::Path::new(&cbz_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| AppError::General {
            message: format!("Invalid file name: {}", cbz_path),
        })?;

    let cover_extensions = vec!["jpg", "jpeg", "png", "webp"];

    for ext in &cover_extensions {
        let cover_path = fm.directory.join(file_stem).join(format!("cover.{}", ext));
        if cover_path.exists() {
            let image_data = fs::read(&cover_path).map_err(|e| AppError::General {
                message: format!("Failed to read cover image: {}", e),
            })?;

            let base64_image = general_purpose::STANDARD.encode(&image_data);

            let mime_type = match ext.as_ref() {
                "png" => "image/png",
                "webp" => "image/webp",
                _ => "image/jpeg",
            };

            return Ok(Some(format!("data:{};base64,{}", mime_type, base64_image)));
        }
    }

    Ok(None)
}

#[command]
pub fn load_image_by_index(
    app_handle: tauri::AppHandle,
    cbz_path: String,
    image_index: usize,
) -> Result<String, AppError> {
    info!("Loading image index {} from: {}", image_index, cbz_path);

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;
    let full_path = fm
        .get_full_path(&cbz_path)
        .map_err(|e| AppError::General { message: e })?;
    let path_str = full_path.to_str().ok_or_else(|| AppError::General {
        message: format!("Invalid path for {}", cbz_path),
    })?;
    CbzViewer::load_image_by_index(path_str, image_index)
        .map_err(|e| AppError::General { message: e })
}

#[command]
pub fn get_page_count(app_handle: tauri::AppHandle, cbz_path: String) -> Result<usize, AppError> {
    info!("Getting page count for: {}", cbz_path);

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;
    let full_path = fm
        .get_full_path(&cbz_path)
        .map_err(|e| AppError::General { message: e })?;
    let path_str = full_path.to_str().ok_or_else(|| AppError::General {
        message: format!("Invalid path for {}", cbz_path),
    })?;
    let image_list =
        CbzViewer::get_image_list(path_str).map_err(|e| AppError::General { message: e })?;
    Ok(image_list.len())
}

#[command]
pub fn delete_file(app_handle: tauri::AppHandle, cbz_path: String) -> Result<(), AppError> {
    info!("Deleting file: {}", cbz_path);
    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General { message: e })?;
    fm.delete_file(&cbz_path)
        .map_err(|e| AppError::General { message: e })
}

#[command]
pub fn edit_metadata_file(
    app_handle: tauri::AppHandle,
    cbz_path: String,
    comic_info: ComicInfo,
) -> Result<(), AppError> {
    info!("Editing metadata for: {}", cbz_path);

    let fm = FileManager::new(&app_handle).map_err(|e| AppError::General {
        message: format!("Error starting FileManager: {}", e),
    })?;

    fm.edit_metadata_file(&cbz_path, &comic_info)
        .map_err(|e| AppError::General {
            message: format!("Error editing metadata file: {}", e),
        })
}
