import type { Bonus, Deduction } from "@/types";

export interface SalaryCalculationResult {
  hra: number;
  pf: number;
  gratuity: number;
  grossPay: number;
  insurancePremium: number;
  netPay: number;
}

/**
 * Calculates salary components based on base pay, bonuses, and deductions
 * @param basePay - The base salary amount
 * @param bonuses - Array of bonus items
 * @param deductions - Array of deduction items
 * @returns Calculated salary components
 */
export const computeSalaryTotals = (
  basePay: number,
  bonuses: Bonus[],
  deductions: Deduction[]
): SalaryCalculationResult => {
  const hra = basePay * 0.5; // 50% of basePay
  const pf = basePay * 0.12; // 12% of basePay (Provident Fund)
  const gratuity = basePay * 0.0481; // 4.81% of basePay
  const grossCore = basePay + hra + gratuity;
  const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const grossPay = grossCore + totalBonus;
  const netBeforeInsurance = grossPay - pf - totalDeductions;
  const insurancePremium = netBeforeInsurance * 0.02; // 2% of net pay
  const netPay = netBeforeInsurance - insurancePremium;

  return {
    hra,
    pf,
    gratuity,
    grossPay,
    insurancePremium,
    netPay
  };
};
