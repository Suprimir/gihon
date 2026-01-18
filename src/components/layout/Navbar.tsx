import { useCallback } from "react";
import { Input } from "../ui/input";

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
    <nav className="border-b p-4 flex flex-row items-center justify-between">
      <h1 className="text-2xl font-bold">Gihon</h1>
      <div className="w-1/2">
        <div className="flex items-center w-full">
          <Input
            type="text"
            placeholder="Search..."
            className="w-full"
            onContextMenu={(e) => e.stopPropagation()}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="flex items-center gap-4"></div>
    </nav>
  );
}
