const DEFAULT_OFFSET = "+05:00";

export function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function toDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function normalizeSlot(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const minutes = date.getMinutes();
  const rounded = Math.floor(minutes / 15) * 15;
  date.setMinutes(rounded, 0, 0);
  return date;
}

export function combineDateAndTime(dateString, timeString) {
  const offset = process.env.APP_TIMEZONE_OFFSET || DEFAULT_OFFSET;
  return new Date(`${dateString}T${timeString}:00${offset}`);
}
