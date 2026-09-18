export type GlobalSearchResult = {
  shipping_lines: {
    id: number;
    name: string;
    code: string;
    shipping_line_group_id?: number | null;
    shipping_line_group_name?: string | null;
  }[];
  ports: { id: number; name: string; code: string }[];
  ships: {
    id: number;
    name: string;
    shipping_line_id: number;
    shipping_line_name: string | null;
    shipping_line_code: string;
    shipping_line_group_id?: number | null;
    shipping_line_group_name?: string | null;
  }[];
  scales: {
    id: number;
    booking_code: string;
    date: string | null;
    ship_name: string;
    port_name: string;
  }[];
};
