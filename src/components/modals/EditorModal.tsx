import { X } from "lucide-react";
import { Comic } from "../../types";
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAlert } from "../../contexts/useAlert";

interface EditorModalProps {
  comic: Comic;
  cover: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditorModal({
  isOpen,
  onClose,
  comic,
  cover,
  onUpdate,
}: EditorModalProps) {
  const [actualComic, setActualComic] = useState<Comic>(comic);
  const { showAlert } = useAlert();

  // ---------------- Effects ----------------

  useEffect(() => {
    setActualComic(comic);
  }, [comic]);

  // ---------------- Saving  ----------------

  const handleSave = useCallback(async () => {
    try {
      await invoke("edit_metadata_file", {
        comicInfo: actualComic.comicInfo,
        cbzPath: comic?.fileName,
      });

      onUpdate();
      onClose();
    } catch (error) {
      showAlert("error", "Error saving metadata", String(error), 5000);
      console.error("Failed to save metadata:", error);
    }
  }, [actualComic, comic, onClose, onUpdate, showAlert]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            <h2 className="text-white text-xl font-bold">Edit Metadata</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all duration-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-56 flex-shrink-0">
              <div className="relative group">
                <img
                  src={cover || ""}
                  alt={comic?.comicInfo?.title || "Cover"}
                  className="w-full rounded-lg shadow-lg object-cover aspect-[2/3] bg-gray-800"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-800">
                <p className="text-gray-400 text-xs leading-relaxed">
                  ℹ️ Metadata is stored locally and does not modify the original
                  CBZ file.
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold text-sm block mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter title..."
                    value={actualComic.comicInfo?.title || ""}
                    onChange={(e) =>
                      setActualComic({
                        ...actualComic,
                        comicInfo: {
                          ...actualComic.comicInfo!,
                          title: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold text-sm block mb-2">
                    Series
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter series..."
                    value={actualComic.comicInfo?.series || ""}
                    onChange={(e) =>
                      setActualComic({
                        ...actualComic,
                        comicInfo: {
                          ...actualComic.comicInfo!,
                          series: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold text-sm block mb-2">
                    Volume
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter volume..."
                    value={actualComic.comicInfo?.volume || ""}
                    onChange={(e) =>
                      setActualComic({
                        ...actualComic,
                        comicInfo: {
                          ...actualComic.comicInfo!,
                          volume: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold text-sm block mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter year..."
                    value={actualComic.comicInfo?.year || ""}
                    onChange={(e) =>
                      setActualComic({
                        ...actualComic,
                        comicInfo: {
                          ...actualComic.comicInfo!,
                          year: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold text-sm block mb-2">
                  Writer
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter writer name..."
                  value={actualComic.comicInfo?.writer || ""}
                  onChange={(e) =>
                    setActualComic({
                      ...actualComic,
                      comicInfo: {
                        ...actualComic.comicInfo!,
                        writer: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold text-sm block mb-2">
                  Summary
                </label>
                <textarea
                  className="w-full h-32 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter summary..."
                  value={actualComic.comicInfo?.summary || ""}
                  onChange={(e) =>
                    setActualComic({
                      ...actualComic,
                      comicInfo: {
                        ...actualComic.comicInfo!,
                        summary: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-900 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50 transition-all duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
