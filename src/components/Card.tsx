import { ImageOff } from "lucide-react";
import { Comic, Metadata } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import CardContextMenu from "./modals/CardContextMenu";
import EditorModal from "./modals/EditorModal";
import { Card as ShadCard, CardContent, CardHeader } from "./ui/card";
import { toast } from "sonner";

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
      toast.error("Error loading comic data");
      console.error(`Error loading data for ${fileName}:`, error);
      setComic({ fileName, comicInfo: null });
      setCoverImage("");
    } finally {
      setIsLoading(false);
    }
  }, [fileName]);

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

  const openEditor = useCallback(() => {
    setEditorModal(true);
  }, []);

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
      <CardContextMenu
        comic={comic}
        onEdit={openEditor}
        onDelete={handleDelete}
      >
        <ShadCard
          onClick={handleClick}
          className="w-36 hover:scale-105 p-0 gap-0 transition-all duration-200 cursor-pointer"
        >
          <CardHeader className="p-0 gap-0">
            <div className="relative w-full h-48 rounded-t-lg flex items-center justify-center overflow-hidden">
              {isLoading ? (
                <div className="w-full h-full animate-pulse" />
              ) : coverImage ? (
                <img
                  src={coverImage}
                  alt={comic.comicInfo?.title || fileName}
                  className="w-full h-full object-cover rounded-t-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <ImageOff size={48} />
                  <p className="text-xs mt-2 px-3 text-center">
                    {comic.comicInfo?.title || fileName}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-center px-2 py-1.5">
            <h2 className="font-bold leading-tight text-sm line-clamp-2">
              {comic.comicInfo?.title || "Loading..."}
            </h2>
            <p className="text-xs mt-0.5">
              {comic.comicInfo?.writer || "Unknown"}
            </p>
          </CardContent>
        </ShadCard>
      </CardContextMenu>

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
