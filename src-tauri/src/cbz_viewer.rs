use std::fs::File;
use std::io::{BufReader, Read};
use serde::{Serialize, Deserialize};
use zip::ZipArchive;
use base64::engine::general_purpose;
use base64::Engine;

#[derive(Serialize, Deserialize)]
pub struct ComicInfo {
    pub title: String,
    pub series: String,
    pub writer: String,
    pub summary: String,
    pub year: String,
}

pub struct CbzViewer;

impl CbzViewer {
    fn extract_tag_value(contents: &str, tag: &str) -> Option<String> {
        let start_tag = format!("<{}>", tag);
        let end_tag = format!("</{}>", tag);
        let start = contents.find(&start_tag)? + start_tag.len();
        let end = contents.find(&end_tag)?;
        Some(contents[start..end].trim().to_string())
    }

    pub fn read_comic_info(cbz_path: &str) -> Result<ComicInfo, String> {
        let file = File::open(cbz_path).map_err(|e| e.to_string())?;
        let mut archive: ZipArchive<BufReader<File>> = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().to_lowercase();

            if name.ends_with("comicinfo.xml") {
                let mut contents = String::new();
                file.read_to_string(&mut contents).map_err(|e| e.to_string())?;

                let title = Self::extract_tag_value(&contents, "Title").unwrap_or_default();
                let series = Self::extract_tag_value(&contents, "Series").unwrap_or_default();
                let writer = Self::extract_tag_value(&contents, "Writer").unwrap_or_default();
                let summary = Self::extract_tag_value(&contents, "Summary").unwrap_or_default();
                let year: String = Self::extract_tag_value(&contents, "Year").unwrap_or_default();

                return Ok(ComicInfo {
                    title,
                    series,
                    writer,
                    summary,
                    year,
                });
            }
        }

        Err("ComicInfo.xml not found".into())
    }

    pub fn extract_cover_image(cbz_path: &str) -> Result<Option<String>, String> {
        let file = File::open(cbz_path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().to_lowercase();

            if name.ends_with(".jpg") || name.ends_with(".png") {
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
                let encoded = general_purpose::STANDARD.encode(buffer);
                return Ok(Some(format!("data:image/{};base64,{}", 
                    if name.ends_with(".png") { "png" } else { "jpeg" },
                    encoded
                )));
            }
        }

        Ok(None)
    }

    pub fn load_images(cbz_path: &str) -> Result<Vec<String>, String> {
        let file = File::open(cbz_path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;

        let mut images_base64 = Vec::new();

        let mut entries: Vec<_> = (0..archive.len()).collect();
        entries.sort_by_key(|&i| archive.by_index(i).unwrap().name().to_lowercase());

        for i in entries {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().to_lowercase();

            if name.ends_with(".jpg") || name.ends_with(".png") {
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
                let encoded = general_purpose::STANDARD.encode(buffer);
                images_base64.push(format!("data:image/{};base64,{}", 
                    if name.ends_with(".png") { "png" } else { "jpeg" },
                    encoded
                ));
            }
        }

        Ok(images_base64)
    }
}
