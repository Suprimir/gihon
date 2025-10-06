mod commands;
mod file_manager;
mod config_manager;
mod cbz_viewer;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_config, 
            commands::save_config,
            commands::add_file,
            commands::list_files,
            commands::read_comic_info,
            commands::get_metadata,
            commands::get_cover_image,
            commands::read_cbz,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
