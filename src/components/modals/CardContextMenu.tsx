import { useCallback, useEffect, useRef } from "react";
import { Comic } from "../../types";
import { Pencil, Trash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useAlert } from "../../contexts/useAlert";

interface CardContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  comic: Comic;
}

export default function CardContextMenu({
  x,
  y,
  visible,
  onClose,
  onEdit,
  onDelete,
  comic,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useAlert();

  // ---------------- Effects ----------------

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // ---------------- Menu Actions ----------------

  const handleDelete = useCallback(async () => {
    try {
      await invoke("delete_file", { cbzPath: comic.fileName });
    } catch (error) {
      showAlert("error", "Error deleting comic", String(error), 5000);
      console.error("Failed to delete comic:", error);
    }

    onDelete();
    onClose();
  }, [comic, onClose, onDelete, showAlert]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 p-2 rounded-md shadow-lg bg-gray-700 w-52 text-sm text-white"
    >
      <p className="px-2 py-1 text-xs font-medium text-primary-700">
        {comic.comicInfo?.title || "Sin título"}
      </p>
      <ul className="mt-1">
        <li className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 w-full p-2 rounded cursor-pointer hover:bg-gray-600/50"
          >
            <Pencil size={16} />
            Edit comic
          </button>
        </li>
        <li className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full p-2 rounded cursor-pointer text-red-500 hover:text-red-400 hover:bg-gray-600/50"
          >
            <Trash size={16} />
            Delete manga
          </button>
        </li>
      </ul>
    </div>
  );
}
