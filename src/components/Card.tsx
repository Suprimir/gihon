import { ImageOff } from "lucide-react";
import { ComicInfo, Manga } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import CardContextMenu from "./modals/CardContextMenu";
import EditorModal from "./modals/EditorModal";

interface CardProps {
  fileName: string;
  searchTerm?: string;
  onClick: (comicInfo: Manga) => void;
  onUpdate: () => void;
}

export default function Card({
  fileName,
  searchTerm,
  onClick,
  onUpdate,
}: CardProps) {
  const [comicInfo, setComicInfo] = useState<ComicInfo | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorModal, setEditorModal] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  async function readComicInfo(filePath: string) {
    const comicInfo = await invoke<ComicInfo | null>("get_metadata", {
      cbzPath: filePath,
    });
    setComicInfo(comicInfo);
  }

  useEffect(() => {
    readComicInfo(fileName);

    const loadCover = async () => {
      try {
        const cover = await invoke<string | null>("get_cover_image", {
          cbzPath: fileName,
        });
        setCoverImage(cover);
      } catch (error) {
        console.error("Error loading cover image:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCover();
  }, [fileName]);

  const shouldHide = () => {
    if (!comicInfo || !searchTerm) return false;

    const searchLower = searchTerm.toLowerCase();
    const titleMatch = comicInfo.title?.toLowerCase().includes(searchLower);
    const seriesMatch = comicInfo.series?.toLowerCase().includes(searchLower);

    return !titleMatch && !seriesMatch;
  };

  const handleClick = () => {
    const mangaInfo: Manga = {
      fileName,
      comicInfo,
    };

    onClick(mangaInfo);
  };

  return (
    <>
      <div
        hidden={shouldHide()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="flex flex-col items-center bg-gray-600 rounded-lg w-36 hover:scale-105 hover:bg-gray-700 transition-all duration-200 cursor-pointer"
      >
        <div className="relative w-full h-48 bg-gray-700 rounded-t-lg flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gray-800 animate-pulse" />
          ) : coverImage ? (
            <img
              src={coverImage}
              alt={comicInfo?.title || fileName}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <ImageOff size={48} className="text-gray-500" />
              <p className="text-white text-xs mt-2 px-2 text-center">
                {comicInfo?.title || fileName}
              </p>
            </div>
          )}
        </div>
        <div className="text-center p-2">
          <h2 className="text-white font-bold leading-none text-sm">
            {comicInfo?.title || "Loading..."}
          </h2>
          <p className="text-white text-xs opacity-75">
            {comicInfo?.writer || "Unknown"}
          </p>
        </div>
      </div>

      <CardContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        manga={{
          fileName,
          comicInfo,
        }}
        onEdit={() => setEditorModal(true)}
        onDelete={onUpdate}
      />

      <EditorModal
        key={fileName}
        isOpen={editorModal}
        onClose={() => setEditorModal(false)}
        onUpdate={() => readComicInfo(fileName)}
        comicInfo={comicInfo}
        fileName={fileName}
        cover={coverImage}
      />
    </>
  );
}
