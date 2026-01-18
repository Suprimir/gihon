import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Card, MangaViewer, Navbar } from "./components/index";
import { Upload } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Comic } from "./types";
import { toast } from "sonner";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [isDragEntered, setIsDragEntered] = useState(false);

  const listFiles = useCallback(async (): Promise<string[]> => {
    try {
      return await invoke<string[]>("list_files");
    } catch (error) {
      console.error("Error listing files:", error);
      throw new Error("Failed to load manga files");
    }
  }, []);

  const addFile = useCallback(async (filePath: string): Promise<void> => {
    try {
      await invoke("add_file", { sourcePath: filePath });
    } catch (error) {
      toast.error("Error adding file");
      console.error("Error adding file:", error);
    }
  }, []);

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
      toast.error("Error adding files");
    }
  };

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden relative">
      <Navbar setSearchTerm={setSearchTerm} />

      <div className="flex-1 flex flex-row flex-wrap justify-center content-start gap-4 p-4 overflow-y-auto bg-accent">
        {files.length === 0 && (
          <div className="text-center mt-20">
            No manga files found. Drag and drop your .cbz, .zip, .cbr, .rar
            files to get started.
          </div>
        )}
        {files.map((fileName) => (
          <Card
            searchTerm={searchTerm}
            key={fileName}
            fileName={fileName}
            onClick={(comic: Comic) => setSelectedComic(comic)}
            onUpdate={refreshFiles}
          />
        ))}
      </div>

      {isDragEntered && (
        <div className="absolute inset-0 backdrop-blur-sm border-4 border-dashed flex flex-col items-center justify-center z-50 pointer-events-none">
          <Upload size={80} className="mb-4 animate-bounce" />
          <p className="text-2xl font-bold">Drop your manga files here</p>
          <p className="text-lg mt-2">
            Supported formats: .cbz, .zip, .cbr, .rar
          </p>
        </div>
      )}

      <MangaViewer
        comic={selectedComic}
        onClose={() => setSelectedComic(null)}
      />
    </main>
  );
}

export default App;
