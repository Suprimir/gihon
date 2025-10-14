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
      className="fixed z-50 min-w-[200px] rounded-lg shadow-2xl bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-300 truncate">
          {comic.comicInfo?.title || "Sin título"}
        </p>
      </div>
      <ul className="py-1">
        <li>
          <button
            onClick={onEdit}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
          >
            <Pencil size={16} className="text-blue-400" />
            <span>Edit comic</span>
          </button>
        </li>
        <li className="my-1 mx-2 border-t border-gray-800" />
        <li>
          <button
            onClick={handleDelete}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150"
          >
            <Trash size={16} />
            <span>Delete manga</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
