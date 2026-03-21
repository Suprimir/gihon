import { UIEvent, useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { Card, MangaViewer, Navbar } from "./components/index";
import { Loader2, Upload } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Comic } from "./types";
import { toast } from "sonner";

const BATCH_SIZE = 2;
const INITIAL_RENDER_COUNT = 48;
const LOAD_MORE_STEP = 24;

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [isDragEntered, setIsDragEntered] = useState(false);
  const [isAddingFiles, setIsAddingFiles] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    completed: 0,
  });

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

  useEffect(() => {
    setVisibleCount(Math.min(files.length, INITIAL_RENDER_COUNT));
  }, [files.length]);

  const visibleFiles = useMemo(() => {
    return files.slice(0, visibleCount);
  }, [files, visibleCount]);

  const handleGridScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const remaining =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (remaining < 300 && visibleCount < files.length) {
        setVisibleCount((current) =>
          Math.min(current + LOAD_MORE_STEP, files.length),
        );
      }
    },
    [files.length, visibleCount],
  );

  const handleFileDrop = async (paths: string[]) => {
    const validPaths = paths?.filter(Boolean) ?? [];
    if (validPaths.length === 0) return;

    setIsAddingFiles(true);
    setIsDragEntered(false);
    setImportProgress({ total: validPaths.length, completed: 0 });

    let batch: string[] = [];
    let completed = 0;

    try {
      for (const file of validPaths) {
        batch.push(file);
        if (batch.length === BATCH_SIZE) {
          await Promise.all(batch.map((file) => addFile(file)));
          completed += batch.length;
          setImportProgress({ total: validPaths.length, completed });
          batch = [];

          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      if (batch.length > 0) {
        await Promise.all(batch.map((file) => addFile(file)));
        completed += batch.length;
        setImportProgress({ total: validPaths.length, completed });
      }

      await refreshFiles();
      toast.success("Files added successfully");
    } catch (error) {
      console.error("Error adding files:", error);
      toast.error("Error adding files");
    } finally {
      setIsAddingFiles(false);
      setImportProgress({ total: 0, completed: 0 });
    }
  };

  const progressPercent =
    importProgress.total > 0
      ? Math.round((importProgress.completed / importProgress.total) * 100)
      : 0;

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden relative">
      <Navbar setSearchTerm={setSearchTerm} />

      <div
        onScroll={handleGridScroll}
        className="flex-1 flex flex-row flex-wrap justify-center content-start gap-4 p-4 overflow-y-auto bg-accent"
      >
        {files.length === 0 && (
          <div className="text-center mt-20">
            No comic files found. Drag and drop your .cbz, .zip, .cbr, .rar
            files to get started.
          </div>
        )}
        {visibleFiles.map((fileName) => (
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
          <p className="text-2xl font-bold">Drop your comic files here</p>
          <p className="text-lg mt-2">
            Supported formats: .cbz, .zip, .cbr, .rar
          </p>
        </div>
      )}

      {isAddingFiles && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="w-[90%] max-w-md rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="animate-spin" size={20} />
              <p className="text-lg font-semibold">Adding files...</p>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {importProgress.completed} / {importProgress.total} processed (
              {progressPercent}%)
            </p>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
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
