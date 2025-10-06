import { useEffect, useState } from "react";
import "./App.css";
import { Card, MangaViewer, Navbar } from "./components/index";
import { Upload } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Manga } from "./types";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [isDragEntered, setIsDragEntered] = useState(false);

  async function listFiles(): Promise<string[]> {
    return await invoke<string[]>("list_files");
  }

  async function addFile(filePath: string): Promise<void> {
    await invoke("add_file", { sourcePath: filePath });
  }

  async function refreshFiles() {
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
    const validFiles = paths.filter((path) => path.endsWith(".cbz"));

    for (const file of validFiles) {
      await addFile(file);
    }

    await refreshFiles();
  };

  return (
    <main className="bg-gray-800 w-screen h-screen flex flex-col overflow-hidden relative">
      <Navbar setSearchTerm={setSearchTerm} />

      <div className="flex-1 flex flex-row flex-wrap justify-center content-start gap-4 p-4 overflow-y-auto">
        {files.map((fileName) => (
          <Card
            searchTerm={searchTerm}
            key={fileName}
            fileName={fileName}
            onClick={(manga: Manga) => setSelectedManga(manga)}
          />
        ))}
      </div>

      {isDragEntered && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm border-4 border-dashed border-blue-500 flex flex-col items-center justify-center z-50 pointer-events-none">
          <Upload size={80} className="text-blue-500 mb-4 animate-bounce" />
          <p className="text-white text-2xl font-bold">
            Drop your manga files here
          </p>
          <p className="text-gray-300 text-lg mt-2">
            Supported formats: .cbz, .zip
          </p>
        </div>
      )}

      <MangaViewer
        manga={selectedManga}
        onClose={() => setSelectedManga(null)}
      />
    </main>
  );
}

export default App;
