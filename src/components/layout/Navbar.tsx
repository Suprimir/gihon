import { useCallback } from "react";

interface NavbarProps {
  setSearchTerm?: (term: string) => void;
}

export default function Navbar({ setSearchTerm }: NavbarProps) {
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (setSearchTerm) {
        setSearchTerm(event.target.value);
      }
    },
    [],
  );

  return (
    <nav className="bg-gray-900 p-4 flex flex-row items-center justify-between">
      <h1 className="text-white text-2xl font-bold">Gihon</h1>
      <div className="w-1/2">
        <div className="flex items-center w-full">
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded p-2 bg-gray-950 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="flex items-center gap-4"></div>
    </nav>
  );
}
