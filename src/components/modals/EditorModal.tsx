import { Comic } from "../../types";
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";

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
      toast.error("Error saving metadata");
      console.error("Failed to save metadata:", error);
    }
  }, [actualComic, comic, onClose, onUpdate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[55rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit {comic?.comicInfo?.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6">
          <div className="w-full lg:w-1/3 flex-shrink-0">
            <img
              src={cover ? cover : ""}
              className="w-full max-w-xs lg:max-w-none mx-auto rounded-lg object-cover"
            />
            <div>
              <p className="text-sm mt-2 break-all">
                The metadata is only for display in the app and is not applied
                to the metadata files built into the CBZ file.
              </p>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <Label
                  htmlFor="title"
                  className="font-bold text-sm md:text-base"
                >
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  className="w-full"
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
                <Label
                  htmlFor="series"
                  className="font-bold text-sm md:text-base"
                >
                  Series
                </Label>
                <Input
                  id="series"
                  type="text"
                  className="w-full"
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
                <Label
                  htmlFor="volume"
                  className="font-bold text-sm md:text-base"
                >
                  Volume
                </Label>
                <Input
                  id="volume"
                  type="text"
                  className="w-full"
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
                <Label
                  htmlFor="year"
                  className="font-bold text-sm md:text-base"
                >
                  Year
                </Label>
                <Input
                  id="year"
                  type="text"
                  className="w-full"
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
              <Label
                htmlFor="writer"
                className="font-bold text-sm md:text-base"
              >
                Writer
              </Label>
              <Input
                id="writer"
                type="text"
                className="w-full"
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
              <Label
                htmlFor="summary"
                className="font-bold text-sm md:text-base"
              >
                Summary
              </Label>
              <Textarea
                id="summary"
                className="w-full h-36 resize-none"
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
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto font-bold py-2 px-4 rounded"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
