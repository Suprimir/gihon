use std::{fs, path::Path};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::cbz_viewer::{CbzViewer, ComicInfo};
use base64::engine::general_purpose;
use base64::Engine;
pub struct FileManager {
    pub directory: PathBuf,
}

impl FileManager {
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let mut data_dir = app.path().app_data_dir().map_err(|e| e.to_string()).unwrap();
        
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

        data_dir.push("comics");
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

        Ok(Self {
            directory: data_dir,
        })
    }

    pub fn get_full_path(&self, file_name: &str) -> Result<PathBuf, String> {
        let file = Path::new(file_name);
        let file_stem = file.file_stem().ok_or("Invalid file name")?.to_str().ok_or("Invalid file name")?;

        Ok(self.directory.join(file_stem).join(file_name))
    }

    pub fn add_file(&self, source_path: &str) -> Result<(), String> {
        let source = Path::new(source_path);
        
        let file_stem = source.file_stem().ok_or("Invalid file name")?.to_str().ok_or("Invalid file name")?;
        let file_name = source.file_name().ok_or("Invalid file name")?.to_str().ok_or("Invalid file name")?;

        let folder_path = self.directory.join(file_stem);
        fs::create_dir_all(&folder_path).map_err(|e| e.to_string())?;

        let destination_path = folder_path.join(file_name);
        fs::copy(source_path, &destination_path).map_err(|e| e.to_string())?;
        
        let comic_info = CbzViewer::read_comic_info(destination_path.to_str().ok_or("Invalid path")?)?;
        self.create_metadata_file(&folder_path, &comic_info).map_err(|e| e.to_string())?;

        let comic_cover = CbzViewer::extract_cover_image(destination_path.to_str().ok_or("Invalid path")?)?;
        if let Some(cover_image_data) = comic_cover {
            self.copy_cover_image(&folder_path, &cover_image_data).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn create_metadata_file(&self, folder_path: &PathBuf, comic_info: &ComicInfo) -> Result<(), String> {
        let metadata_path = folder_path.join("metadata.json");
        let metadata = serde_json::to_string_pretty(comic_info).map_err(|e| e.to_string())?;
        fs::write(metadata_path, metadata).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn copy_cover_image(&self, folder_path: &PathBuf, cover_image_data: &str) -> Result<(), String> {
        let cover_path = folder_path.join("cover");
        let base64_data = cover_image_data.split(',').nth(1).ok_or("Invalid image data")?;
        let image_data = general_purpose::STANDARD.decode(base64_data).map_err(|e| e.to_string())?;

        let extension = if cover_image_data.starts_with("data:image/jpeg") {
            "jpg"
        } else if cover_image_data.starts_with("data:image/png") {
            "png"
        } else {
            return Err("Unsupported image format".to_string());
        };
        
        let cover_path = cover_path.with_extension(extension);
        fs::write(cover_path, image_data).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_files(&self) -> Result<Vec<String>, String> {
        let entries = fs::read_dir(&self.directory).map_err(|e| e.to_string())?;

        let mut files = Vec::new();

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("cbz") {
                if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                    files.push(file_name.to_string());
                }
            } else if path.is_dir() {
                let sub_entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
                for sub_entry in sub_entries {
                    let sub_entry = sub_entry.map_err(|e| e.to_string())?;
                    let sub_path = sub_entry.path();
                    if sub_path.is_file() && sub_path.extension().and_then(|s| s.to_str()) == Some("cbz") {
                        if let Some(file_name) = sub_path.file_name().and_then(|s| s.to_str()) {
                            files.push(file_name.to_string());
                        }
                    }
                }
            }
        }
        Ok(files)
    }
}
