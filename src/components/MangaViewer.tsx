import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Manga } from "../types";

interface MangaViewerProps {
  manga: Manga | null;
  onClose: () => void;
}

export default function MangaViewer({ manga, onClose }: MangaViewerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (manga) {
      loadImages();
    }
  }, [manga]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") previousPage();
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, images.length]);

  async function loadImages() {
    if (!manga) return;

    setLoading(true);
    try {
      const imageList = await invoke<string[]>("read_cbz", {
        cbzPath: manga.fileName,
      });
      setImages(imageList);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  }

  const nextPage = () => {
    if (currentPage < images.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!manga) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-xl font-bold">
            {manga.comicInfo?.title}
          </h2>
          <span className="text-gray-400">
            Page {currentPage + 1} of {images.length}
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
        {loading ? (
          <div className="text-white text-xl">Loading...</div>
        ) : images.length > 0 ? (
          <>
            <img
              src={images[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="max-w-full max-h-full object-contain"
            />

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
              disabled={currentPage === images.length - 1}
              className={`absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/80 text-white p-3 rounded-full transition-all ${
                currentPage === images.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-800"
              }`}
            >
              <ChevronRight size={32} />
            </button>
          </>
        ) : (
          <div className="text-white text-xl">No images found</div>
        )}
      </div>

      <div className="bg-gray-900 p-4 flex justify-center gap-2">
        <input
          type="range"
          min="0"
          max={images.length - 1}
          value={currentPage}
          onChange={(e) => setCurrentPage(parseInt(e.target.value))}
          className="w-96"
        />
      </div>
    </div>
  );
}
