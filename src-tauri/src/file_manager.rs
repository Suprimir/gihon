use std::path::PathBuf;
use std::{fs, path::Path};
use tauri::{AppHandle, Manager};

use crate::cbz_viewer::{CbzViewer, ComicInfo};
pub struct FileManager {
    pub directory: PathBuf,
    pub screenshots_dir: String,
}

impl FileManager {
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let mut data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())
            .unwrap();

        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

        data_dir.push("comics");
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

        Ok(Self {
            directory: data_dir,
            screenshots_dir: dirs::picture_dir()
                .map(|p| p.join("Gihon Screenshots").to_str().unwrap().to_string())
                .unwrap_or_else(|| "Gihon Screenshots".to_string()),
        })
    }

    pub fn get_full_path(&self, file_name: &str) -> Result<PathBuf, String> {
        let file = Path::new(file_name);
        let file_stem = file
            .file_stem()
            .ok_or("Invalid file name")?
            .to_str()
            .ok_or("Invalid file name")?;

        Ok(self.directory.join(file_stem).join(file_name))
    }

    pub fn add_file(&self, source_path: &str) -> Result<(), String> {
        let source = Path::new(source_path);

        let file_stem = source
            .file_stem()
            .ok_or("Invalid file name")?
            .to_str()
            .ok_or("Invalid file name")?;
        let file_name = source
            .file_name()
            .ok_or("Invalid file name")?
            .to_str()
            .ok_or("Invalid file name")?;

        let folder_path = self.directory.join(file_stem);
        fs::create_dir_all(&folder_path).map_err(|e| e.to_string())?;

        let destination_path = folder_path.join(file_name);

        if destination_path.exists() {
            return Err("File already exists in the library".to_string());
        }

        fs::copy(source_path, &destination_path).map_err(|e| e.to_string())?;

        let comic_info =
            match CbzViewer::read_comic_info(destination_path.to_str().ok_or("Invalid path")?) {
                Ok(info) => info,
                Err(_) => {
                    println!("Warning: Could not read ComicInfo.xml, using placeholder data.");
                    ComicInfo {
                        title: file_stem.to_string(),
                        series: "".to_string(),
                        number: "".to_string(),
                        volume: "".to_string(),
                        summary: "".to_string(),
                        year: "".to_string(),
                        month: "".to_string(),
                        day: "".to_string(),
                        writer: "Unknown".to_string(),
                        publisher: "".to_string(),
                        page_count: "".to_string(),
                    }
                }
            };

        self.create_metadata_file(&folder_path, &comic_info)
            .map_err(|e| e.to_string())?;

        let comic_cover =
            CbzViewer::extract_cover_image(destination_path.to_str().ok_or("Invalid path")?)?;
        if let Some((cover_image_bytes, extension)) = comic_cover {
            self.copy_cover_image_bytes(&folder_path, &cover_image_bytes, &extension)
                .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete_file(&self, file_name: &str) -> Result<(), String> {
        let file = Path::new(file_name);
        let file_stem = file
            .file_stem()
            .ok_or("Invalid file name")?
            .to_str()
            .ok_or("Invalid file name")?;

        let folder_path = self.directory.join(file_stem);
        if folder_path.exists() {
            fs::remove_dir_all(&folder_path).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn create_metadata_file(
        &self,
        folder_path: &PathBuf,
        comic_info: &ComicInfo,
    ) -> Result<(), String> {
        let metadata_path = folder_path.join("metadata.json");
        let metadata = serde_json::to_string_pretty(comic_info).map_err(|e| e.to_string())?;
        fs::write(metadata_path, metadata).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn edit_metadata_file(
        &self,
        cbz_path: &String,
        comic_info: &ComicInfo,
    ) -> Result<(), String> {
        let file = Path::new(cbz_path);
        let file_stem = file
            .file_stem()
            .ok_or("Invalid file name")?
            .to_str()
            .ok_or("Invalid file name")?;
        let metadata_path = self.directory.join(file_stem).join("metadata.json");
        if metadata_path.exists() {
            let metadata = serde_json::to_string_pretty(comic_info).map_err(|e| e.to_string())?;
            fs::write(metadata_path, metadata).map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Metadata file does not exist".to_string())
        }
    }

    pub fn copy_cover_image_bytes(
        &self,
        folder_path: &PathBuf,
        image_data: &[u8],
        extension: &str,
    ) -> Result<(), String> {
        let extension = match extension {
            "jpg" | "jpeg" => "jpg",
            "png" => "png",
            _ => return Err("Unsupported image format".to_string()),
        };

        let cover_path = folder_path.join("cover").with_extension(extension);
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
                    if sub_path.is_file()
                        && sub_path.extension().and_then(|s| s.to_str()) == Some("cbz")
                        || sub_path.extension().and_then(|s| s.to_str()) == Some("zip")
                        || sub_path.extension().and_then(|s| s.to_str()) == Some("cbr")
                        || sub_path.extension().and_then(|s| s.to_str()) == Some("rar")
                    {
                        if let Some(file_name) = sub_path.file_name().and_then(|s| s.to_str()) {
                            files.push(file_name.to_string());
                        }
                    }
                }
            }
        }
        Ok(files)
    }

    pub fn save_image(&self, buffer: &[u8]) {
        fs::create_dir_all(&self.screenshots_dir).unwrap();

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let file_path =
            Path::new(&self.screenshots_dir).join(format!("screenshot_{}.png", timestamp));
        fs::write(file_path, buffer).unwrap();
    }
}
