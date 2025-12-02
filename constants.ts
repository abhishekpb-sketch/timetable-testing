
// For this public sheet, we use the gviz endpoint which doesn't require an API key.
// SPREADSHEET_ID must correspond to a "Published to the web" or publicly viewable sheet.
export const SPREADSHEET_ID = "1JYuF1u1r5OE4kEQl-USajOC8S4VjbHUnz_jpUz35qHs";
export const SHEET_TAB_NAME = "TimeTable";

export const SECTIONS: string[] = ['A', 'B', 'C', 'D', 'E'];

// Slots for Sections A, D, E
export const SLOTS_ADE = ["09:15", "11:00", "12:45", "15:15", "17:15", "19:00"];

// Slots for Sections B, C (15 minutes earlier shift usually)
export const SLOTS_BC = ["09:00", "10:45", "12:30", "15:00", "16:45", "18:30"];

export const getSectionSlots = (section: string): string[] => {
  if (section === 'B' || section === 'C') {
    return SLOTS_BC;
  }
  return SLOTS_ADE;
};

export const SECTION_COLUMN_MAP: Record<string, number> = {
  'A': 3,  // Column D (0-indexed -> 3)
  'B': 9,  // Column J
  'C': 15, // Column P
  'D': 21, // Column V
  'E': 27  // Column AB
};
