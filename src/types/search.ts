export type GlobalSearchResult = {
  shipping_lines: { id: number; name: string; code: string }[];
  ports: { id: number; name: string; code: string }[];
  ships: {
    id: number;
    name: string;
    shipping_line_name: string | null;
    shipping_line_code: string;
  }[];
  scales: {
    id: number;
    booking_code: string;
    date: string | null;
    ship_name: string;
    port_name: string;
  }[];
};
