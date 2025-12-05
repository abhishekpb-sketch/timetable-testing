
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

  // Try parsing the date
  let date = new Date(`${cleanStr} ${year}`);
  
  // If that fails, try alternative formats
  if (isNaN(date.getTime())) {
    // Try with full month name
    const monthMap: Record<string, string> = {
      'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
      'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
      'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
    };
    
    for (const [abbr, full] of Object.entries(monthMap)) {
      if (lowerStr.startsWith(abbr)) {
        const dayMatch = cleanStr.match(/\d+/);
        if (dayMatch) {
          date = new Date(`${full} ${dayMatch[0]}, ${year}`);
          if (!isNaN(date.getTime())) break;
        }
      }
    }
  }
  
  // If still invalid, return null
  if (isNaN(date.getTime())) {
    return null;
  }
  
  // Normalize to midnight for consistent comparison
  date.setHours(0, 0, 0, 0);
  return date;
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
    if (!json.table || !json.table.rows) {
      console.error("Invalid response structure:", json);
      throw new Error("Sheet response missing table data");
    }
    
    const rows = json.table.rows.map((row: any) => {
        // row.c is array of cells. Cell can be null.
        if (!row.c) return [];
        return row.c.map((cell: any) => {
            if (!cell) return "";
            // Use formatted value (f) if available to get the display string (e.g. "Oct 7"), otherwise value (v)
            return (cell.f || cell.v || "").toString();
        });
    });
    
    console.log(`Parsed ${rows.length} rows from sheet`);

    const processed: DaySchedule[] = [];
    const startIndex = SECTION_COLUMN_MAP[section] || 21;
    const currentSlotsConfig = getSectionSlots(section);

    // Find the header row or start of data dynamically
    // We look for the first row that contains a valid date-like string in the second column (Index 1)
    let dataStartRow = 0;
    const monthPatterns = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                           "October", "November", "December", "January", "February", "March", "April"];
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i]?.[1];
      if (cell && typeof cell === 'string') {
        const cellLower = cell.toLowerCase();
        if (monthPatterns.some(pattern => cellLower.includes(pattern.toLowerCase()))) {
          dataStartRow = i;
          break;
        }
      }
    }

    console.log(`Processing section ${section}, starting from row ${dataStartRow}, column index ${startIndex}`);
    
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      // Safety check for row length
      if (!row || row.length < 2) continue;

      const dateObj = parseSheetDate(row[1]);
      if (!dateObj) {
        // Only log first few failures to avoid spam
        if (i < dataStartRow + 3) {
          console.log(`Failed to parse date from row ${i}, cell value: "${row[1]}"`);
        }
        continue;
      }

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
    
    console.log(`Processed ${processed.length} days with classes for section ${section}`);
    return processed;

  } catch (error) {
    console.error("Failed to fetch timetable:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", {
      message: errorMessage,
      section,
      spreadsheetId: SPREADSHEET_ID,
      sheetTab: SHEET_TAB_NAME
    });
    throw new Error(`Failed to load timetable: ${errorMessage}`);
  }
};
