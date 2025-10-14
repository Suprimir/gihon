import { ImageOff } from "lucide-react";
import { Comic, Metadata } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import CardContextMenu from "./modals/CardContextMenu";
import EditorModal from "./modals/EditorModal";
import { useAlert } from "../contexts/useAlert";

interface CardProps {
  fileName: string;
  searchTerm?: string;
  onClick: (comic: Comic) => void;
  onUpdate: () => void;
}

export default function Card({
  fileName,
  searchTerm = "",
  onClick,
  onUpdate,
}: CardProps) {
  const [comic, setComic] = useState<Comic>({ fileName, comicInfo: null });
  const [coverImage, setCoverImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [editorModal, setEditorModal] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const { showAlert } = useAlert();

  // ---------------- Data loading ----------------

  const loadData = useCallback(async () => {
    try {
      const [cover, metadata] = await Promise.all([
        invoke<string>("get_cover_image", { cbzPath: fileName }),
        invoke<Metadata | null>("get_metadata", { cbzPath: fileName }),
      ]);

      setComic({ fileName, comicInfo: metadata });
      setCoverImage(cover || "");
    } catch (error) {
      showAlert("error", "Error loading comic data", String(error), 5000);
      console.error(`Error loading data for ${fileName}:`, error);
      setComic({ fileName, comicInfo: null });
      setCoverImage("");
    } finally {
      setIsLoading(false);
    }
  }, [fileName, showAlert]);

  // ---------------- Search filtering ----------------

  const isVisible = useCallback(() => {
    if (!searchTerm.trim()) return true;
    if (!comic.comicInfo) return true;

    const searchLower = searchTerm.toLowerCase();
    const { title, series } = comic.comicInfo;

    return (
      title?.toLowerCase().includes(searchLower) ||
      series?.toLowerCase().includes(searchLower) ||
      false
    );
  }, [comic.comicInfo, searchTerm]);

  // ---------------- Event handlers ----------------

  const handleClick = useCallback(() => {
    if (comic && !isLoading) onClick(comic);
  }, [comic, isLoading, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu]);

  const openEditor = useCallback(() => {
    setEditorModal(true);
    closeContextMenu();
  }, [closeContextMenu]);

  const closeEditor = useCallback(() => {
    setEditorModal(false);
  }, []);

  const handleUpdate = useCallback(() => {
    loadData();
    onUpdate();
  }, [loadData, onUpdate]);

  const handleDelete = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  // ---------------- Effects ----------------

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isVisible()) return null;

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="group flex flex-col bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      >
        <div className="relative w-full aspect-[2/3] bg-gray-800 flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gray-800 animate-pulse" />
          ) : coverImage ? (
            <>
              <img
                src={coverImage}
                alt={comic.comicInfo?.title || fileName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-3">
              <ImageOff size={40} className="text-gray-600 mb-2" />
              <p className="text-gray-500 text-xs text-center line-clamp-2">
                {comic.comicInfo?.title || fileName}
              </p>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-900 border-t border-gray-800">
          <h2 className="text-white font-semibold text-sm line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
            {comic.comicInfo?.title || "Loading..."}
          </h2>
          <p className="text-gray-400 text-xs line-clamp-1">
            {comic.comicInfo?.series || "Unknown"}
          </p>
        </div>
      </div>

      <CardContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onClose={closeContextMenu}
        comic={comic}
        onEdit={openEditor}
        onDelete={handleDelete}
      />

      <EditorModal
        key={`${fileName}-${editorModal}`}
        isOpen={editorModal}
        onClose={closeEditor}
        onUpdate={handleUpdate}
        comic={comic}
        cover={coverImage}
      />
    </>
  );
}
