import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Manga } from "../types";

interface MangaViewerProps {
  manga: Manga | null;
  onClose: () => void;
}

export default function MangaViewer({ manga, onClose }: MangaViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(
    async (index: number) => {
      if (!manga) return;

      if (cache.has(index)) {
        setCurrentImage(cache.get(index) || null);
        return;
      }

      setIsLoading(true);

      try {
        const imageData = await invoke<string>("load_image_by_index", {
          cbzPath: manga.fileName,
          imageIndex: index,
        });
        setCurrentImage(imageData);

        setCache((prevCache) => new Map(prevCache).set(index, imageData));
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [manga, cache]
  );

  const preloadPage = useCallback(
    async (index: number) => {
      if (!manga) return;

      if (cache.has(index)) return;

      try {
        const imageData = await invoke<string>("load_image_by_index", {
          cbzPath: manga.fileName,
          imageIndex: index,
        });
        setCache((prevCache) => new Map(prevCache).set(index, imageData));
      } catch (error) {
        console.error("Error loading page:", error);
      }
    },
    [manga, cache]
  );

  useEffect(() => {
    if (!manga) return;

    const loadManga = async () => {
      try {
        setCache(new Map());
        setCurrentImage(null);
        setCurrentPage(0);

        const pageCount = await invoke<number>("get_page_count", {
          cbzPath: manga.fileName,
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

    loadManga();
  }, [manga?.fileName]);

  // Keyboard navigation

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") previousPage();
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      const nextIndex = currentPage + 1;
      setCurrentPage(nextIndex);
      loadPage(nextIndex);

      if (nextIndex + 1 < totalPages) {
        preloadPage(nextIndex + 1);
      }
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      const previousIndex = currentPage - 1;
      setCurrentPage(previousIndex);
      loadPage(previousIndex);

      if (previousIndex - 1 >= 0) {
        preloadPage(previousIndex - 1);
      }
    }
  };

  useEffect(() => {
    if (currentPage >= 0 && currentPage < totalPages) {
      loadPage(currentPage);
    }
  }, [currentPage, totalPages]);

  if (!manga) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-xl font-bold">
            {manga.comicInfo?.title}
          </h2>
          <span className="text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
        {isLoading ? (
          <div className="text-white text-xl">
            Loading page {currentPage + 1}...
          </div>
        ) : currentImage ? (
          <img
            src={currentImage}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-white text-xl">No image available</div>
        )}
      </div>

      <button
        onClick={previousPage}
        disabled={currentPage === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/80 text-white p-3 rounded-full transition-all ${
          currentPage === 0
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-gray-800"
        }`}
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={nextPage}
        disabled={currentPage === totalPages - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/80 text-white p-3 rounded-full transition-all ${
          currentPage === totalPages - 1
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-gray-800"
        }`}
      >
        <ChevronRight size={32} />
      </button>

      <div className="bg-gray-900 p-4 flex justify-center gap-2">
        <input
          type="range"
          min="0"
          max={totalPages - 1}
          value={currentPage}
          onChange={(e) => setCurrentPage(parseInt(e.target.value))}
          className="w-96"
        />
      </div>
    </div>
  );
}
