import { X, BookOpen, Gauge } from "lucide-react";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Config } from "../../types";
import { useAlert } from "../../contexts/useAlert";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [preloadOffset, setPreloadOffset] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const config = await invoke<Config>("load_config");
      setPreloadOffset(config.preload_offset);
    } catch (error) {
      console.error("Failed to load settings:", error);
      showAlert("error", "Failed to load settings", String(error), 3000);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const config: Config = {
        preload_offset: preloadOffset,
      };
      await invoke("save_config", { config });
      showAlert(
        "success",
        "Settings saved",
        "Your preferences have been saved successfully",
        2000
      );
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      showAlert("error", "Failed to save settings", String(error), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreloadChange = (value: number) => {
    if (value >= 0 && value <= 5) {
      setPreloadOffset(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            <h2 className="text-white text-xl font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all duration-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Reader Settings
              </h3>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge size={18} className="text-gray-400" />
                    <label className="text-white font-semibold text-sm">
                      Page Preload Offset
                    </label>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Number of pages to preload ahead/behind the current page.
                    Higher values improve reading experience but use more
                    memory.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={preloadOffset}
                  onChange={(e) =>
                    handlePreloadChange(parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500
                    [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-gradient-to-br
                    [&::-moz-range-thumb]:from-blue-500 [&::-moz-range-thumb]:to-purple-600
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
                />
                <div className="flex items-center justify-center w-12 h-10 bg-gray-700 rounded-lg border border-gray-600">
                  <span className="text-white font-bold text-lg">
                    {preloadOffset}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex justify-between text-xs text-gray-500">
                <span>None (0)</span>
                <span>Balanced (1-2)</span>
                <span>Aggressive (3-5)</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 border-dashed">
            <p className="text-gray-500 text-sm text-center italic">
              More settings coming soon...
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-900 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
