// utils/helpers.test.js
import { describe, it, expect } from 'vitest';
import { add } from './helpers.js';

describe('add function', () => {
  it('should return the sum of two numbers', () => {
    // 断言：期望 add(1, 2) 的结果是 3
    expect(add(1, 2)).toBe(3);
  });

  it('should work with negative numbers', () => {
    // 断言：期望 add(-1, -1) 的结果是 -2
    expect(add(-1, -1)).toBe(-2);
  });
});