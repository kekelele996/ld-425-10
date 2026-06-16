import { describe, it, expect } from 'vitest';
import { calculateVariance, calculateMaterialTotal } from '../budgetCalculator';

describe('calculateVariance - 差异计算 (口径：预算 - 实际)', () => {
  describe('基础边界场景', () => {
    it('实际=预算，差异为 0', () => {
      expect(calculateVariance(10000, 10000)).toBe(0);
    });

    it('预算为 0，实际有花费，差异为负数（超支）', () => {
      const result = calculateVariance(0, 5000);
      expect(result).toBeLessThan(0);
      expect(result).toBe(-5000);
    });

    it('实际为 0，差异等于预算（节余）', () => {
      expect(calculateVariance(8000, 0)).toBe(8000);
    });
  });

  describe('超支场景 (实际 > 预算) → 差异应为负数', () => {
    it('轻度超支：预算 10000，实际 11000，差异为 -1000', () => {
      const variance = calculateVariance(10000, 11000);
      expect(variance).toBeLessThan(0);
      expect(variance).toBe(-1000);
    });

    it('重度超支：预算 5000，实际 15000，差异为 -10000', () => {
      const variance = calculateVariance(5000, 15000);
      expect(variance).toBeLessThan(0);
      expect(variance).toBe(-10000);
    });

    it('超支场景下超支提醒判断：variance < 0 应命中', () => {
      const variance = calculateVariance(20000, 25000);
      const isOverBudget = variance < 0;
      expect(isOverBudget).toBe(true);
      expect(variance).toBe(-5000);
    });
  });

  describe('节余场景 (实际 < 预算) → 差异应为正数', () => {
    it('轻度节余：预算 10000，实际 9000，差异为 1000', () => {
      const variance = calculateVariance(10000, 9000);
      expect(variance).toBeGreaterThan(0);
      expect(variance).toBe(1000);
    });

    it('节余场景下超支提醒判断：variance < 0 不应命中', () => {
      const variance = calculateVariance(30000, 25000);
      const isOverBudget = variance < 0;
      expect(isOverBudget).toBe(false);
      expect(variance).toBe(5000);
    });
  });

  describe('追加花费后按新口径变化', () => {
    it('节余状态追加花费 → 差异按新口径减少', () => {
      const budgetAmount = 20000;
      let actualCost = 15000;
      const before = calculateVariance(budgetAmount, actualCost);
      expect(before).toBe(5000);

      actualCost += 3000;
      const after = calculateVariance(budgetAmount, actualCost);
      expect(after).toBe(2000);
      expect(after).toBeLessThan(before);
    });

    it('刚好持平后继续追加 → 由 0 变为负数（触发超支）', () => {
      const budgetAmount = 10000;
      let actualCost = 10000;
      const before = calculateVariance(budgetAmount, actualCost);
      expect(before).toBe(0);
      expect(before < 0).toBe(false);

      actualCost += 1000;
      const after = calculateVariance(budgetAmount, actualCost);
      expect(after).toBe(-1000);
      expect(after < 0).toBe(true);
    });

    it('已超支后继续追加 → 差异负数增大（超支更严重）', () => {
      const budgetAmount = 8000;
      let actualCost = 10000;
      const before = calculateVariance(budgetAmount, actualCost);
      expect(before).toBe(-2000);
      expect(before < 0).toBe(true);

      actualCost += 1500;
      const after = calculateVariance(budgetAmount, actualCost);
      expect(after).toBe(-3500);
      expect(after).toBeLessThan(before);
      expect(after < 0).toBe(true);
    });
  });

  describe('精度处理 (保留 2 位小数)', () => {
    it('浮点运算结果保留 2 位小数', () => {
      expect(calculateVariance(100, 33.333)).toBe(66.67);
    });

    it('超支浮点结果保留 2 位小数', () => {
      expect(calculateVariance(100, 133.333)).toBe(-33.33);
    });
  });
});

describe('calculateMaterialTotal - 材料合计', () => {
  it('数量 × 单价 正常计算', () => {
    expect(calculateMaterialTotal(10, 25.5)).toBe(255);
  });

  it('0 数量结果为 0', () => {
    expect(calculateMaterialTotal(0, 999)).toBe(0);
  });
});
