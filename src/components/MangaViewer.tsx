import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Comic, Config } from "../types";
import { useAlert } from "../contexts/useAlert";

interface MangaViewerProps {
  comic: Comic | null;
  onClose: () => void;
}

const CONTROLS_HIDE_DELAY = 1200;

export default function MangaViewer({ comic, onClose }: MangaViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [preloadOffset, setPreloadOffset] = useState<number>(1);

  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showAlert } = useAlert();

  // Load preload offset from settings
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<Config>("load_config");
        setPreloadOffset(config.preload_offset);
      } catch (error) {
        console.error("Failed to load config:", error);
        // Use default value if config fails to load
        setPreloadOffset(1);
      }
    };
    loadConfig();
  }, []);

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
    [comic, cache, showAlert]
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
    [comic, cache, showAlert]
  );

  // ---------------- Navigation ----------------

  const nextPage = useCallback(() => {
    if (currentPage >= totalPages - 1) return;

    const nextIndex = currentPage + 1;
    setCurrentPage(nextIndex);

    if (nextIndex + preloadOffset < totalPages) {
      preloadPage(nextIndex + preloadOffset);
    }
  }, [currentPage, totalPages, preloadPage, preloadOffset]);

  const previousPage = useCallback(() => {
    if (currentPage <= 0) return;
    const previousIndex = currentPage - 1;
    setCurrentPage(previousIndex);

    if (previousIndex - preloadOffset >= 0) {
      preloadPage(previousIndex - preloadOffset);
    }
  }, [currentPage, preloadPage, preloadOffset]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
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
      className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950 z-50 flex flex-col"
    >
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            <h2 className="text-white text-xl font-bold truncate max-w-md">
              {comic.comicInfo?.title || "Unknown Title"}
            </h2>
            <div className="px-3 py-1 bg-gray-800/80 rounded-full border border-gray-700">
              <span className="text-gray-300 text-sm font-medium">
                {currentPage + 1} / {totalPages}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all duration-200"
            title="Close Viewer (Esc)"
            aria-label="Close Viewer"
          >
            <X size={24} />
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-700 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
            </div>
            <p className="text-white text-lg font-medium">
              Loading page {currentPage + 1}...
            </p>
          </div>
        ) : currentImage ? (
          <img
            src={currentImage}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain select-none drop-shadow-2xl"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <X size={32} className="text-gray-600" />
            </div>
            <div className="text-gray-400 text-lg">No image available</div>
          </div>
        )}

        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-gray-900/95 backdrop-blur-md p-3 rounded-xl border border-gray-700/50 shadow-2xl transition-all duration-300 ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 rounded-lg transition-all duration-200 focus:outline-none group"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2
                size={20}
                className="text-gray-300 group-hover:text-white"
              />
            ) : (
              <Maximize2
                size={20}
                className="text-gray-300 group-hover:text-white"
              />
            )}
          </button>
        </div>

        {isFullscreen && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md px-5 py-2.5 rounded-xl border border-gray-700/50 shadow-2xl text-white text-sm font-medium transition-all duration-300 ${
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
        className={`absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-full border border-gray-700/50 shadow-2xl transition-all z-10 focus:outline-none ${
          currentPage === 0
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 hover:scale-110 hover:border-transparent"
        } ${
          showControls
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        onClick={nextPage}
        disabled={currentPage === totalPages - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-full border border-gray-700/50 shadow-2xl transition-all z-10 focus:outline-none ${
          currentPage === totalPages - 1
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 hover:scale-110 hover:border-transparent"
        } ${
          showControls
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-4 pointer-events-none"
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={28} />
      </button>

      {!isFullscreen && (
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-800 p-4 flex justify-center gap-2 shadow-lg">
          <input
            type="range"
            min="0"
            max={Math.max(0, totalPages - 1)}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value))}
            className="w-full max-w-2xl h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500 
              [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-gradient-to-br 
              [&::-moz-range-thumb]:from-blue-500 [&::-moz-range-thumb]:to-purple-600 
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer 
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg
              [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
            aria-label="Page slider"
          />
        </div>
      )}
    </div>
  );
}
