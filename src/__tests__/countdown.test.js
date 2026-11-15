import { expect, test } from 'vitest';
import { daysBefore, remaining } from '../lib/countdown.js';

const LAUNCH = { year: 2026, monthIndex: 10, day: 19 };
test('daysBefore: whole UTC days to the launch day', () => {
  expect(daysBefore(new Date('2025-03-12'), LAUNCH)).toBe(617);
  expect(daysBefore(new Date('2026-11-18'), LAUNCH)).toBe(1);
  expect(daysBefore(new Date('2026-11-19'), LAUNCH)).toBe(0);
  expect(daysBefore(new Date('2026-11-20'), LAUNCH)).toBe(-1);
});

test('counts down', () => {
  expect(remaining(0, 90061000)).toEqual({
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    done: false,
  });
});
test('done at and after the target', () => {
  expect(remaining(5, 5).done).toBe(true);
  expect(remaining(9, 5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
});
