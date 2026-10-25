import { SearchInput } from "@/components/ui/SearchInput";

interface ClientSearchInputProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function ClientSearchInput({ searchTerm, setSearchTerm }: ClientSearchInputProps) {
  return (
    <div className="sticky top-0 z-10 bg-background py-2 -mx-4 px-4 md:static md:mx-0 md:px-0">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>
    </div>
  );
}
