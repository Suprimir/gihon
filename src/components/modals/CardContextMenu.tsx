import { useCallback } from "react";
import { Comic } from "../../types";
import { Pencil, Trash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "../ui/context-menu";
import { toast } from "sonner";

interface CardContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  comic: Comic;
}

export default function CardContextMenu({
  children,
  onEdit,
  onDelete,
  comic,
}: CardContextMenuProps) {
  const handleDelete = useCallback(async () => {
    try {
      await invoke("delete_file", { cbzPath: comic.fileName });
      onDelete();
    } catch (error) {
      toast.error("Error deleting comic");
      console.error("Failed to delete comic:", error);
    }
  }, [comic, onDelete]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <div className="px-2 py-1.5 text-xs font-medium">
          {comic.comicInfo?.title || "Sin título"}
        </div>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onEdit}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil size={16} />
          Edit comic
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleDelete}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Trash size={16} />
          Delete manga
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
