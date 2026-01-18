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
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner";

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
        toast.error("Error loading page");
        onClose();
        console.error("Error loading page:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [comic, cache],
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
        toast.error("Error loading page");
        console.error("Error loading page:", error);
      }
    },
    [comic, cache],
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
      className="fixed inset-0 z-50 flex flex-col"
    >
      {!isFullscreen && (
        <div className="p-4 flex justify-between items-center bg-background">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold truncate max-w-md">
              {comic.comicInfo?.title || "Unknown Title"}
            </h2>
            <span className="text-sm">
              {currentPage + 1} / {totalPages}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onClose} variant="ghost" size="icon">
                  <X size={28} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close Viewer (Esc)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-accent">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 rounded-full animate-spin" />
            <p className="text-xl">Loading page {currentPage + 1}...</p>
          </div>
        ) : currentImage ? (
          <img
            src={currentImage}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="text-xl">No image available</div>
        )}

        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-3 rounded-lg shadow-xl transition-all duration-300 bg-accent ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={toggleFullscreen} variant="ghost" size="icon">
                  {isFullscreen ? (
                    <Minimize2 size={20} />
                  ) : (
                    <Maximize2 size={20} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isFullscreen && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 backdrop-blur-sm px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
              showControls
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            Page {currentPage + 1} of {totalPages}
          </div>
        )}
      </div>

      <Button
        onClick={previousPage}
        disabled={currentPage === 0}
        variant="ghost"
        size="icon-lg"
        style={
          !showControls
            ? {
                opacity: 0,
                transform: "translateX(-1rem) translateY(-50%)",
                pointerEvents: "none",
              }
            : {}
        }
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-10 ${
          currentPage === 0
            ? "opacity-30 cursor-not-allowed"
            : "hover:scale-110"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={32} />
      </Button>

      <Button
        onClick={nextPage}
        disabled={currentPage === totalPages - 1}
        variant="ghost"
        size="icon-lg"
        style={
          !showControls
            ? {
                opacity: 0,
                transform: "translateX(1rem) translateY(-50%)",
                pointerEvents: "none",
              }
            : {}
        }
        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-10 ${
          currentPage === totalPages - 1
            ? "opacity-30 cursor-not-allowed"
            : "hover:scale-110"
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={32} />
      </Button>

      {!isFullscreen && (
        <div className="p-4 flex justify-center gap-2 bg-background">
          <Slider
            min={0}
            max={Math.max(0, totalPages - 1)}
            step={1}
            value={[currentPage]}
            onValueChange={(value) => goToPage(value[0])}
            className="w-full max-w-2xl cursor-pointer"
            aria-label="Page slider"
          />
        </div>
      )}
    </div>
  );
}
