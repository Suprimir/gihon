import { useEffect, useRef } from "react";
import { Manga } from "../../types";
import { Pencil, Trash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface CardContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  manga: Manga;
}

export default function CardContextMenu({
  x,
  y,
  visible,
  onClose,
  onEdit,
  onDelete,
  manga,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleDelete = async () => {
    await invoke("delete_file", { cbzPath: manga.fileName });

    onDelete();
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 p-2 rounded-md shadow-lg bg-gray-700 w-52 text-sm text-white"
    >
      <p className="px-2 py-1 text-xs font-medium text-primary-700">
        {manga.comicInfo?.title || "Unknown Title"}
      </p>
      <ul className="mt-1">
        <li className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 w-full p-2 cursor-pointer rounded hover:bg-gray-600/50"
          >
            <Pencil size={16} />
            Edit manga
          </button>
        </li>
        <li className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full p-2 cursor-pointer rounded hover:bg-gray-600/50 text-red-500 hover:text-red-400"
          >
            <Trash size={16} />
            Delete manga
          </button>
        </li>
      </ul>
    </div>
  );
}
