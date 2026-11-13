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
