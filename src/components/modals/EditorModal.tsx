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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">
            Edit {comic?.comicInfo?.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6">
          <div className="w-full lg:w-1/3 flex-shrink-0">
            <img
              src={cover ? cover : ""}
              className="w-full max-w-xs lg:max-w-none mx-auto rounded-lg object-cover"
            />
            <div>
              <p className="text-gray-400 text-sm mt-2 break-all">
                The metadata is only for display in the app and is not applied
                to the metadata files built into the CBZ file.
              </p>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-white font-bold text-sm md:text-base block mb-2">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 text-white"
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
              <div className="w-full sm:w-1/2">
                <label className="text-white font-bold text-sm md:text-base block mb-2">
                  Series
                </label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={actualComic.comicInfo?.series || ""}
                  onChange={(e) => {
                    setActualComic({
                      ...actualComic,
                      comicInfo: {
                        ...actualComic.comicInfo!,
                        series: e.target.value,
                      },
                    });
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-white font-bold text-sm md:text-base block mb-2">
                  Volume
                </label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 text-white"
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
              <div className="w-full sm:w-1/2">
                <label className="text-white font-bold text-sm md:text-base block mb-2">
                  Year
                </label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 text-white"
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
              <label className="text-white font-bold text-sm md:text-base block mb-2">
                Writer
              </label>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-700 text-white"
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
              <label className="text-white font-bold text-sm md:text-base block mb-2">
                Summary
              </label>
              <textarea
                className="w-full h-36 p-2 rounded bg-gray-700 text-white resize-none"
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
            <button
              onClick={handleSave}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-900/70 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
