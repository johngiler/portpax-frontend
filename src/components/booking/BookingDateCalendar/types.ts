export type CalendarDayBooking = {
  id: number;
  booking_code: string;
  port_name: string;
  shipping_line_name: string;
  vessel_name: string;
  vessel_id: number;
  port_id: number;
  call_date: string;
  position_id: number | null;
  position_code: string | null;
  vessel_loa_m: string | null;
  eta: string | null;
  etd: string | null;
  status: string;
  status_display: string;
  blocksSelection: boolean;
  isCurrentPort: boolean;
};
