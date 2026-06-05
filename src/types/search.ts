export type GlobalSearchResult = {
  shipping_lines: { id: number; name: string; code: string }[];
  ports: { id: number; name: string; code: string }[];
  ships: { id: number; name: string; code: string; shipping_line_name: string | null }[];
  scales: { id: number; date: string | null; ship_name: string; port_name: string }[];
};
