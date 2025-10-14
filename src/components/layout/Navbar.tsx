import { useCallback } from "react";
import { Search, Settings, BookOpen } from "lucide-react";

interface NavbarProps {
  setSearchTerm?: (term: string) => void;
  onSettingsClick?: () => void;
}

export default function Navbar({
  setSearchTerm,
  onSettingsClick,
}: NavbarProps) {
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (setSearchTerm) {
        setSearchTerm(event.target.value);
      }
    },
    [setSearchTerm]
  );

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg border-b border-gray-700">
      <div className="px-6 py-4 flex flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-fit">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-md">
            <BookOpen className="text-white" size={24} />
          </div>
          <h1 className="text-white text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
            Gihon
          </h1>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search
                className="text-gray-400 group-focus-within:text-blue-400 transition-colors"
                size={20}
              />
            </div>
            <input
              type="text"
              placeholder="Search your manga collection..."
              className="w-full rounded-lg pl-12 pr-4 py-2.5 bg-gray-950/50 backdrop-blur-sm text-white placeholder-gray-500 
                       border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all duration-200 hover:bg-gray-950/70"
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-fit">
          <button
            onClick={onSettingsClick}
            className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white 
                     transition-all duration-200 border border-gray-700 hover:border-gray-600 
                     hover:shadow-lg hover:scale-105 active:scale-95"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
