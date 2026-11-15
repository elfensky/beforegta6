/**
 * @param {number} nowMs
 * @param {number} targetMs
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, done: boolean }}
 */
export function remaining(nowMs, targetMs) {
  const left = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
    done: left === 0,
  };
}

/**
 * Whole days from a content date to the launch day, both as UTC midnights. 0 on the launch day, negative after it.
 * @param {Date} date
 * @param {{ year: number, monthIndex: number, day: number }} launch
 * @returns {number}
 */
export function daysBefore(date, launch) {
  return Math.round(
    (Date.UTC(launch.year, launch.monthIndex, launch.day) - date.getTime()) / 86_400_000,
  );
}
