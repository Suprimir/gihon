use tauri::command;
use crate::file_manager::FileManager;
use crate::config_manager::{Config, ConfigManager};
use crate::cbz_viewer::{CbzViewer, ComicInfo};
use std::fs;
use base64::engine::general_purpose;
use base64::Engine;

#[command]
pub fn load_config(app_handle: tauri::AppHandle) -> Result<Config, String> {
    let cm = ConfigManager::new(&app_handle)?;
    cm.load_config()
}

#[command]
pub fn save_config(app_handle: tauri::AppHandle, config: Config) -> Result<(), String> {
    let cm = ConfigManager::new(&app_handle)?;
    cm.save_config(&config)?;
    Ok(())
}

#[command]
pub fn add_file(app_handle: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let fm = FileManager::new(&app_handle)?;
    fm.add_file(&source_path)
}

#[command]
pub fn list_files(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let fm = FileManager::new(&app_handle)?;
    fm.list_files()
}

#[command]
pub fn read_comic_info(app_handle: tauri::AppHandle, cbz_path: String) -> Result<ComicInfo, String> {
    let fm = FileManager::new(&app_handle)?;
    let full_path = fm.get_full_path(&cbz_path)?.to_str().ok_or("Invalid path")?.to_string();
    CbzViewer::read_comic_info(&full_path)
}

#[command]
pub fn get_metadata(app_handle: tauri::AppHandle, cbz_path: String) -> Result<ComicInfo, String> {
    let fm = FileManager::new(&app_handle)?;
    
    let file_stem = std::path::Path::new(&cbz_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid file name")?;
    
    let metadata_file = fm.directory.join(file_stem).join("metadata.json");
    let comic_info = if metadata_file.exists() {
        let metadata_data = std::fs::read_to_string(&metadata_file)
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        serde_json::from_str::<ComicInfo>(&metadata_data)
            .map_err(|e| format!("Failed to parse metadata: {}", e))?
    } else {
        let full_path = fm.get_full_path(&cbz_path)?;
        CbzViewer::read_comic_info(full_path.to_str().ok_or("Invalid path")?)?
    };
    
    Ok(comic_info)
}

#[command]
pub fn get_cover_image(app_handle: tauri::AppHandle, cbz_path: String) -> Result<Option<String>, String> {
    let fm = FileManager::new(&app_handle)?;
    
    let file_stem = std::path::Path::new(&cbz_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid file name")?;
    
    let cover_extensions = vec!["jpg", "jpeg", "png", "webp"];
    
    for ext in &cover_extensions {
        let cover_path = fm.directory.join(file_stem).join(format!("cover.{}", ext));
        if cover_path.exists() {
            let image_data = fs::read(&cover_path)
                .map_err(|e| format!("Failed to read cover image: {}", e))?;
            
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
pub fn load_image_by_index(app_handle: tauri::AppHandle, cbz_path: String, image_index: usize) -> Result<String, String> {
    let fm = FileManager::new(&app_handle)?;
    let full_path = fm.get_full_path(&cbz_path)?;    
    CbzViewer::load_image_by_index(full_path.to_str().ok_or("Invalid path")?, image_index)
}

#[command]
pub fn get_page_count(app_handle: tauri::AppHandle, cbz_path: String) -> Result<usize, String> {
    let fm = FileManager::new(&app_handle)?;
    let full_path = fm.get_full_path(&cbz_path)?;
    let image_list = CbzViewer::get_image_list(full_path.to_str().ok_or("Invalid path")?)?;
    Ok(image_list.len())
}