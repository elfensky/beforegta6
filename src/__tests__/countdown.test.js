import { expect, test } from 'vitest';
import { remaining } from '../lib/countdown.js';

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
