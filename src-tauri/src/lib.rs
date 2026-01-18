mod cbz_viewer;
mod commands;
mod config_manager;
mod errors;
mod file_manager;

use log::info;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("Starting Gihon...");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            info!("App setup complete");

            #[cfg(debug_assertions)]
            {
                use tauri::Manager;

                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                    info!("DevTools opened");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_config,
            commands::save_config,
            commands::add_file,
            commands::list_files,
            commands::read_comic_info,
            commands::get_metadata,
            commands::get_cover_image,
            commands::load_image_by_index,
            commands::get_page_count,
            commands::delete_file,
            commands::edit_metadata_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
