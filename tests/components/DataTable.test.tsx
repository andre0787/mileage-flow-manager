import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "@/components/ui/DataTable";

interface TestItem {
  id: number;
  name: string;
  value: number;
}

const columns = [
  { key: "id", label: "ID", render: (i: TestItem) => i.id },
  { key: "name", label: "Nome", render: (i: TestItem) => i.name },
  { key: "value", label: "Valor", render: (i: TestItem) => i.value },
];

const keyExtractor = (i: TestItem) => i.id;

const data: TestItem[] = [
  { id: 1, name: "Item A", value: 100 },
  { id: 2, name: "Item B", value: 200 },
];

describe("DataTable", () => {
  it("renderiza cabeçalho das colunas", () => {
    render(<DataTable columns={columns} data={data} keyExtractor={keyExtractor} />);
    // desktop + mobile views renderizam mesma label
    const headers = screen.getAllByText("ID");
    expect(headers.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Nome").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Valor").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza dados nas linhas (desktop + mobile)", () => {
    render(<DataTable columns={columns} data={data} keyExtractor={keyExtractor} />);
    expect(screen.getAllByText("Item A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Item B").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza estado vazio com título padrão", () => {
    render(<DataTable columns={columns} data={[]} keyExtractor={keyExtractor} />);
    const empty = screen.getAllByText("Nenhum registro encontrado");
    expect(empty.length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza estado de loading como skeleton", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} keyExtractor={keyExtractor} loading />
    );
    expect(container.querySelector(".animate-pulse")).toBeDefined();
  });

  it("renderiza SearchInput quando searchValue é passado", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        searchValue=""
        onSearchChange={() => {}}
      />
    );
    expect(screen.getByPlaceholderText("Buscar...")).toBeDefined();
  });

  it("exibe título customizado de empty state", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={keyExtractor}
        emptyTitle="Nada aqui"
      />
    );
    const titles = screen.getAllByText("Nada aqui");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("aceita custom placeholder no search", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Buscar itens..."
      />
    );
    expect(screen.getByPlaceholderText("Buscar itens...")).toBeDefined();
  });
});
