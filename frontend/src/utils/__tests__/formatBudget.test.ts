import { describe, it, expect } from 'vitest';
import { formatBudget, getVarianceRate } from '../formatBudget';

type BudgetItem = {
  id: string;
  category: string;
  budgetAmount: number;
  actualCost: number;
  variance: number;
};

const createItem = (partial: Partial<BudgetItem>): BudgetItem => ({
  id: '1',
  category: '测试',
  budgetAmount: 0,
  actualCost: 0,
  variance: 0,
  ...partial,
});

describe('getVarianceRate - 执行率计算 (口径：实际 / 预算 × 100)', () => {
  it('预算为 0 时返回 0，避免除零', () => {
    expect(getVarianceRate(0, 1000)).toBe(0);
    expect(getVarianceRate(0, 0)).toBe(0);
  });

  it('未开始花费时执行率为 0', () => {
    expect(getVarianceRate(10000, 0)).toBe(0);
  });

  it('刚好花完预算执行率为 100', () => {
    expect(getVarianceRate(10000, 10000)).toBe(100);
  });

  it('花费一半执行率为 50', () => {
    expect(getVarianceRate(10000, 5000)).toBe(50);
  });

  it('超支 20% 执行率为 120', () => {
    expect(getVarianceRate(10000, 12000)).toBe(120);
  });

  it('四舍五入取整', () => {
    expect(getVarianceRate(10000, 3333)).toBe(33);
    expect(getVarianceRate(10000, 3350)).toBe(34);
  });
});

describe('formatBudget - 金额格式化', () => {
  it('正数格式化为人民币', () => {
    expect(formatBudget(10000)).toContain('¥');
    expect(formatBudget(10000)).toContain('10,000');
  });

  it('超支（负数差异）应显示负号', () => {
    const result = formatBudget(-5000);
    expect(result).toContain('-');
    expect(result).toContain('¥');
    expect(result).toContain('5,000');
  });

  it('0 正常显示', () => {
    expect(formatBudget(0)).toContain('¥');
  });
});

describe('预算超支判断逻辑 (前端口径：variance = 预算 - 实际，超支 = variance < 0)', () => {
  it('variance < 0 判定为超支并触发提醒', () => {
    const items: BudgetItem[] = [
      createItem({ category: '人工', budgetAmount: 10000, actualCost: 12000, variance: -2000 }),
      createItem({ category: '材料', budgetAmount: 8000, actualCost: 7000, variance: 1000 }),
      createItem({ category: '设计', budgetAmount: 5000, actualCost: 6500, variance: -1500 }),
    ];

    const overBudget = items.filter((item) => Number(item.variance) < 0);

    expect(overBudget).toHaveLength(2);
    expect(overBudget.map((i) => i.category)).toEqual(expect.arrayContaining(['人工', '设计']));
    expect(overBudget.length > 0).toBe(true);
  });

  it('没有超支项时不触发提醒', () => {
    const items: BudgetItem[] = [
      createItem({ budgetAmount: 10000, actualCost: 9000, variance: 1000 }),
      createItem({ budgetAmount: 5000, actualCost: 5000, variance: 0 }),
    ];

    const overBudget = items.filter((item) => Number(item.variance) < 0);
    expect(overBudget).toHaveLength(0);
    expect(overBudget.length > 0).toBe(false);
  });

  it('追加实际花费后差异按新口径变化，超支提醒状态正确更新', () => {
    let budgetAmount = 10000;
    let actualCost = 8000;
    const calcVariance = (b: number, a: number) => Number((b - a).toFixed(2));

    let variance = calcVariance(budgetAmount, actualCost);
    expect(variance).toBe(2000);
    expect(variance < 0).toBe(false);

    actualCost += 1000;
    variance = calcVariance(budgetAmount, actualCost);
    expect(variance).toBe(1000);
    expect(variance < 0).toBe(false);

    actualCost += 2000;
    variance = calcVariance(budgetAmount, actualCost);
    expect(variance).toBe(-1000);
    expect(variance < 0).toBe(true);

    actualCost += 1000;
    variance = calcVariance(budgetAmount, actualCost);
    expect(variance).toBe(-2000);
    expect(variance < 0).toBe(true);
    expect(variance).toBeLessThan(-1000);
  });
});
