export type CalendarDayBooking = {
  booking_code: string;
  port_name: string;
  shipping_line_name: string;
  vessel_name: string;
  position_code: string | null;
  status_display: string;
  blocksSelection: boolean;
  isCurrentPort: boolean;
};
