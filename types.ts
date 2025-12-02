export type Section = 'A' | 'B' | 'C' | 'D' | 'E';

export interface TimeSlot {
  time: string;
  subject: string;
}

export interface DaySchedule {
  dateObj: Date;
  dateStr: string;
  dayStr: string;
  slots: TimeSlot[];
}

export interface SheetRow {
  [key: number]: string;
}

export interface GoogleSheetResponse {
  range: string;
  majorDimension: string;
  values: string[][];
  error?: {
    message: string;
  };
}
