export interface ClosingTimes {
  breakfast: string; // "HH:MM" or ""
  lunch: string;     // "HH:MM" or ""
  dinner: string;    // "HH:MM" or ""
  date: string;      // "MMDD"
}

export function parseClosingTimes(timezoneVal: string | null | undefined): ClosingTimes {
  const defaultVal: ClosingTimes = { breakfast: '', lunch: '', dinner: '', date: '' };
  if (!timezoneVal) return defaultVal;
  
  const parts = timezoneVal.split(',');
  const result = { ...defaultVal };
  
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const currentSLDate = `${mm}${dd}`;

  for (const part of parts) {
    const [key, val] = part.split(':');
    if (!key || !val) continue;
    if (key === 'B' && val !== '9999') result.breakfast = `${val.substring(0,2)}:${val.substring(2,4)}`;
    if (key === 'L' && val !== '9999') result.lunch = `${val.substring(0,2)}:${val.substring(2,4)}`;
    if (key === 'D' && val !== '9999') result.dinner = `${val.substring(0,2)}:${val.substring(2,4)}`;
    if (key === 'R') result.date = val;
  }
  

  
  return result;
}
