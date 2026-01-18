import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Comic } from "../types";
import { useAlert } from "../contexts/useAlert";

interface MangaViewerProps {
  comic: Comic | null;
  onClose: () => void;
}

const CONTROLS_HIDE_DELAY = 1200;
const PRELOAD_OFFSET = 1;

export default function MangaViewer({ comic, onClose }: MangaViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showAlert } = useAlert();

  // ---------------- Image Loading and Caching ----------------

  const loadPage = useCallback(
    async (index: number) => {
      if (!comic) return;

      if (cache.has(index)) {
        setCurrentImage(cache.get(index) || null);
        return;
      }

      setIsLoading(true);

      try {
        const imageData = await invoke<string>("load_image_by_index", {
          cbzPath: comic.fileName,
          imageIndex: index,
        });
        setCurrentImage(imageData);

        setCache((prevCache) => new Map(prevCache).set(index, imageData));
      } catch (error) {
        showAlert("error", "Error loading page", String(error), 5000);
        onClose();
        console.error("Error loading page:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [comic, cache, showAlert],
  );

  const preloadPage = useCallback(
    async (index: number) => {
      if (!comic) return;

      if (cache.has(index)) return;

      try {
        const imageData = await invoke<string>("load_image_by_index", {
          cbzPath: comic.fileName,
          imageIndex: index,
        });
        setCache((prevCache) => new Map(prevCache).set(index, imageData));
      } catch (error) {
        showAlert("error", "Error loading page", String(error), 5000);
        console.error("Error loading page:", error);
      }
    },
    [comic, cache, showAlert],
  );

  // ---------------- Navigation ----------------

  const nextPage = useCallback(() => {
    if (currentPage >= totalPages - 1) return;

    const nextIndex = currentPage + 1;
    setCurrentPage(nextIndex);

    if (nextIndex + 1 < totalPages) {
      preloadPage(nextIndex + PRELOAD_OFFSET);
    }
  }, [currentPage, totalPages, preloadPage]);

  const previousPage = useCallback(() => {
    if (currentPage <= 0) return;
    const previousIndex = currentPage - 1;
    setCurrentPage(previousIndex);

    if (previousIndex - 1 >= 0) {
      preloadPage(previousIndex - PRELOAD_OFFSET);
    }
  }, [currentPage, preloadPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= totalPages) return;
      setCurrentPage(page);
    },
    [totalPages],
  );

  // ---------------- Fullscreen ----------------

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ---------------- Controls Visibility ----------------

  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
    }

    mouseTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  // ---------------- Effects ----------------

  // Load manga when it changes (new manga opened)
  useEffect(() => {
    if (!comic) return;

    const initializeManga = async () => {
      try {
        setCache(new Map());
        setCurrentImage(null);
        setCurrentPage(0);

        const pageCount = await invoke<number>("get_page_count", {
          cbzPath: comic.fileName,
        });

        setTotalPages(pageCount);
        await loadPage(0);

        if (pageCount > 1) {
          await preloadPage(1);
        }
      } catch (error) {
        console.error("Error loading manga:", error);
      }
    };

    initializeManga();
  }, [comic?.fileName]);

  // Load current page
  useEffect(() => {
    if (currentPage >= 0 && currentPage < totalPages) {
      loadPage(currentPage);
    }
  }, [currentPage, totalPages, loadPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          nextPage();
          break;
        case "ArrowLeft":
          previousPage();
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentPage,
    isFullscreen,
    nextPage,
    previousPage,
    onClose,
    toggleFullscreen,
  ]);

  // Fullscreen state sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, []);

  if (!comic) return null;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {!isFullscreen && (
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-xl font-bold truncate max-w-md">
              {comic.comicInfo?.title || "Unknown Title"}
            </h2>
            <span className="text-gray-400 text-sm">
              {currentPage + 1} / {totalPages}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close Viewer (Esc)"
            aria-label="Close Viewer"
          >
            <X size={28} />
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-xl">
              Loading page {currentPage + 1}...
            </p>
          </div>
        ) : currentImage ? (
          <img
            src={currentImage}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="text-white text-xl">No image available</div>
        )}

        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50 shadow-xl transition-all duration-300 ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-md transition-colors focus:outline-none"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 size={20} className="text-white" />
            ) : (
              <Maximize2 size={20} className="text-white" />
            )}
          </button>
        </div>

        {isFullscreen && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm transition-all duration-300 ${
              showControls
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            Page {currentPage + 1} of {totalPages}
          </div>
        )}
      </div>

      <button
        onClick={previousPage}
        disabled={currentPage === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/80 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10  focus:outline-none ${
          currentPage === 0
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-gray-800 hover:scale-110"
        } ${
          showControls
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={nextPage}
        disabled={currentPage === totalPages - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/80 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10  focus:outline-none ${
          currentPage === totalPages - 1
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-gray-800 hover:scale-110"
        } ${
          showControls
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-4 pointer-events-none"
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={32} />
      </button>

      {!isFullscreen && (
        <div className="bg-gray-900 p-4 flex justify-center gap-2">
          <input
            type="range"
            min="0"
            max={Math.max(0, totalPages - 1)}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value))}
            className="w-full max-w-2xl cursor-pointer"
            aria-label="Page slider"
          />
        </div>
      )}
    </div>
  );
}
