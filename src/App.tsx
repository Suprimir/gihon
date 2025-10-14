import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Card, MangaViewer, Navbar, SettingsModal } from "./components/index";
import { Upload, BookOpen, Search } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Comic } from "./types";
import { useAlert } from "./contexts/useAlert";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [isDragEntered, setIsDragEntered] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { showAlert } = useAlert();

  const listFiles = useCallback(async (): Promise<string[]> => {
    try {
      return await invoke<string[]>("list_files");
    } catch (error) {
      console.error("Error listing files:", error);
      throw new Error("Failed to load manga files");
    }
  }, []);

  const addFile = useCallback(
    async (filePath: string): Promise<void> => {
      try {
        await invoke("add_file", { sourcePath: filePath });
      } catch (error) {
        showAlert("error", "Error adding file", String(error), 3000);
        console.error("Error adding file:", error);
      }
    },
    [showAlert]
  );

  async function refreshFiles() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const updatedFiles = await listFiles();
    setFiles(updatedFiles);
  }

  useEffect(() => {
    refreshFiles();

    const unlisten = listen("tauri://drag-drop", (event) => {
      const paths = (event.payload as { paths: string[] })?.paths;
      handleFileDrop(paths);
    });

    const unlistenHover = listen("tauri://drag-enter", () => {
      setIsDragEntered(true);
    });

    const unlistenCancelled = listen("tauri://drag-leave", () => {
      setIsDragEntered(false);
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenCancelled.then((fn) => fn());
      unlistenHover.then((fn) => fn());
    };
  }, []);

  const handleFileDrop = async (paths: string[]) => {
    setIsDragEntered(false);

    try {
      await Promise.all(paths.map((file) => addFile(file)));
      await refreshFiles();
    } catch (error) {
      console.error("Error adding files:", error);
    }
  };

  const filteredFiles = files.filter((fileName) =>
    fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="bg-gray-950 w-screen h-screen flex flex-col overflow-hidden relative">
      <Navbar
        setSearchTerm={setSearchTerm}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="bg-gray-900/50 backdrop-blur-sm p-12 rounded-2xl border-2 border-dashed border-gray-800 max-w-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-full shadow-lg">
                    <BookOpen size={48} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">
                      No manga files found
                    </h2>
                    <p className="text-gray-400 text-lg">
                      Drag and drop your manga files to get started
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
                      .cbz
                    </span>
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
                      .zip
                    </span>
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
                      .cbr
                    </span>
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
                      .rar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  <Search size={64} className="mx-auto mb-4 opacity-50" />
                </div>
                <h2 className="text-2xl font-bold text-gray-500">
                  No results found
                </h2>
                <p className="text-gray-600">
                  Try searching with different keywords
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {filteredFiles.map((fileName) => (
                  <Card
                    searchTerm={searchTerm}
                    key={fileName}
                    fileName={fileName}
                    onClick={(comic: Comic) => setSelectedComic(comic)}
                    onUpdate={refreshFiles}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isDragEntered && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm border-4 border-dashed border-blue-500/50 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="bg-gray-950/95 p-12 rounded-2xl border-2 border-blue-500/30 shadow-2xl">
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-full animate-bounce shadow-lg">
                <Upload size={64} className="text-white" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-white text-3xl font-bold">
                  Drop your manga files here
                </p>
                <p className="text-gray-400 text-lg">
                  Release to add to your collection
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-4 py-2 bg-gray-900 text-blue-400 rounded-full border border-gray-800 font-semibold">
                  .cbz
                </span>
                <span className="px-4 py-2 bg-gray-900 text-blue-400 rounded-full border border-gray-800 font-semibold">
                  .zip
                </span>
                <span className="px-4 py-2 bg-gray-900 text-blue-400 rounded-full border border-gray-800 font-semibold">
                  .cbr
                </span>
                <span className="px-4 py-2 bg-gray-900 text-blue-400 rounded-full border border-gray-800 font-semibold">
                  .rar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <MangaViewer
        comic={selectedComic}
        onClose={() => setSelectedComic(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}

export default App;
