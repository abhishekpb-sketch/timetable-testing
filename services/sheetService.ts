
import { SPREADSHEET_ID, SHEET_TAB_NAME, getSectionSlots, SECTION_COLUMN_MAP } from '../constants';
import { DaySchedule, Section, TimeSlot } from '../types';

const parseSheetDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.replace(/(\r\n|\n|\r)/gm, "").trim();
  
  // Heuristic for academic year crossover (Oct 2025 - Mar 2026)
  // If the string starts with Jan/Feb/Mar/Apr, assume 2026, otherwise 2025.
  // Standard format assumed: "Oct 7" or "October 7"
  let year = 2025;
  const lowerStr = cleanStr.toLowerCase();
  if (lowerStr.startsWith('jan') || lowerStr.startsWith('feb') || lowerStr.startsWith('mar') || lowerStr.startsWith('apr')) {
    year = 2026;
  }

  const date = new Date(`${cleanStr} ${year}`);
  return isNaN(date.getTime()) ? null : date;
};

export const fetchTimetable = async (section: Section): Promise<DaySchedule[]> => {
  // Use Google Visualization API to avoid API Key requirement for public sheets
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_TAB_NAME}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // Parse JSONP response
    // Response usually starts with: /*O_o*/ google.visualization.Query.setResponse(
    // and ends with: );
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
       throw new Error("Invalid sheet response format");
    }
    
    const jsonStr = text.substring(start, end + 1);
    const json = JSON.parse(jsonStr);

    if (json.status !== 'ok') {
        throw new Error("Sheet API returned error status");
    }

    // Convert gviz rows to simple string arrays to match existing logic
    // json.table.cols contains column metadata
    // json.table.rows contains data
    const rows = json.table.rows.map((row: any) => {
        // row.c is array of cells. Cell can be null.
        if (!row.c) return [];
        return row.c.map((cell: any) => {
            if (!cell) return "";
            // Use formatted value (f) if available to get the display string (e.g. "Oct 7"), otherwise value (v)
            return (cell.f || cell.v || "").toString();
        });
    });

    const processed: DaySchedule[] = [];
    const startIndex = SECTION_COLUMN_MAP[section] || 21;
    const currentSlotsConfig = getSectionSlots(section);

    // Find the header row or start of data dynamically
    // We look for the first row that contains a valid date-like string in the second column (Index 1)
    let dataStartRow = 0;
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i][1];
      if (cell && (cell.includes("Oct") || cell.includes("Nov") || cell.includes("Dec") || cell.includes("Jan"))) {
        dataStartRow = i;
        break;
      }
    }

    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      // Safety check for row length
      if (!row || row.length < 2) continue;

      const dateObj = parseSheetDate(row[1]);
      if (!dateObj) continue;

      const currentSlots: TimeSlot[] = [];
      let hasClass = false;

      currentSlotsConfig.forEach((time, offset) => {
        // Safe access to column
        const val = row[startIndex + offset];
        if (val && typeof val === 'string' && val.trim() !== "-" && val.trim() !== "") {
          currentSlots.push({
            time: time,
            subject: val.trim()
          });
          hasClass = true;
        }
      });

      if (hasClass) {
        processed.push({
          dateObj: dateObj,
          dateStr: row[1],
          dayStr: row[2] || "",
          slots: currentSlots
        });
      }
    }
    return processed;

  } catch (error) {
    console.error("Failed to fetch timetable:", error);
    throw error;
  }
};
