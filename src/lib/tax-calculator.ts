// Israeli Tax Calculator for 2025
// All calculations based on official tax rates and regulations

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface CreditPointSettings {
  value_monthly: number;
  resident_male: number;
  resident_female: number;
  child_0_5: number;
  child_6_12: number;
  child_13_17: number;
  child_18_plus: number;
  single_parent: number;
  new_immigrant: number;
  returning_resident: number;
}

export interface NISettings {
  threshold_monthly: number;
  max_monthly: number;
  rate_low_employee: number;
  rate_high_employee: number;
  rate_low_health: number;
  rate_high_health: number;
}

// 2025 Tax Settings
export const TAX_SETTINGS_2025 = {
  tax_brackets_annual: [
    { min: 0, max: 84120, rate: 0.10 },
    { min: 84120, max: 120720, rate: 0.14 },
    { min: 120720, max: 193800, rate: 0.20 },
    { min: 193800, max: 269280, rate: 0.31 },
    { min: 269280, max: 560280, rate: 0.35 },
    { min: 560280, max: 721560, rate: 0.47 },
    { min: 721560, max: null, rate: 0.50 }, // 47% + 3% additional tax
  ] as TaxBracket[],

  credit_points: {
    value_monthly: 242,
    resident_male: 2.25,
    resident_female: 2.75,
    child_0_5: 1.5,
    child_6_12: 1.0,
    child_13_17: 1.0,
    child_18_plus: 0.5,
    single_parent: 1.5,
    new_immigrant: 1.0,
    returning_resident: 1.0,
  } as CreditPointSettings,

  national_insurance: {
    threshold_monthly: 7522, // 60% of average wage
    max_monthly: 50695,
    rate_low_employee: 0.0104, // BI part
    rate_high_employee: 0.07, // BI part above threshold
    rate_low_health: 0.0323, // Health part
    rate_high_health: 0.0517, // Health part above threshold
  } as NISettings,
};

export interface Child {
  age: number;
}

export interface CalculationInput {
  gross_monthly: number;
  is_resident: boolean;
  gender: 'male' | 'female';
  age: number;
  children: Child[];
  single_parent: boolean;
  new_immigrant: boolean;
  returning_resident: boolean;
  manual_credit_points: number;
  months_worked_in_year: number;
  bonus_current_month?: number;
}

export interface CalculationResult {
  gross: number;
  income_tax_before_credits: number;
  credit_points: {
    auto: number;
    manual: number;
    total: number;
    value_monthly: number;
    total_value: number;
  };
  income_tax_after_credits: number;
  national_insurance: number;
  health_tax: number;
  total_deductions: number;
  net: number;
  employer_cost: number;
  breakdown: {
    tax_by_bracket: Array<{
      bracket: TaxBracket;
      amount: number;
      effective_rate: number;
    }>;
    ni_breakdown: {
      low_part: number;
      high_part: number;
    };
    health_breakdown: {
      low_part: number;
      high_part: number;
    };
  };
}

export function calculateIncomeTax(grossAnnual: number): { tax: number; breakdown: any[] } {
  let remainingIncome = grossAnnual;
  let totalTax = 0;
  const breakdown = [];

  for (const bracket of TAX_SETTINGS_2025.tax_brackets_annual) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.min;
    const bracketMax = bracket.max || Infinity;
    const taxableInBracket = Math.min(remainingIncome, bracketMax - bracketMin);

    if (taxableInBracket > 0) {
      const taxInBracket = taxableInBracket * bracket.rate;
      totalTax += taxInBracket;
      
      breakdown.push({
        bracket,
        amount: taxInBracket,
        effective_rate: bracket.rate,
        taxable_amount: taxableInBracket,
      });

      remainingIncome -= taxableInBracket;
    }
  }

  return { tax: totalTax, breakdown };
}

export function calculateCreditPoints(input: CalculationInput): number {
  const settings = TAX_SETTINGS_2025.credit_points;
  let points = 0;

  // Base resident points
  if (input.is_resident) {
    points += input.gender === 'male' ? settings.resident_male : settings.resident_female;
  }

  // Children points
  for (const child of input.children) {
    if (child.age <= 5) {
      points += settings.child_0_5;
    } else if (child.age <= 12) {
      points += settings.child_6_12;
    } else if (child.age <= 17) {
      points += settings.child_13_17;
    } else {
      points += settings.child_18_plus;
    }
  }

  // Additional points
  if (input.single_parent) {
    points += settings.single_parent;
  }
  if (input.new_immigrant) {
    points += settings.new_immigrant;
  }
  if (input.returning_resident) {
    points += settings.returning_resident;
  }

  return points;
}

export function calculateNationalInsuranceAndHealth(grossMonthly: number, isResident: boolean) {
  const settings = TAX_SETTINGS_2025.national_insurance;
  const cappedGross = Math.min(grossMonthly, settings.max_monthly);

  let nationalInsurance = 0;
  let healthTax = 0;
  
  // Low part (up to threshold)
  const lowPart = Math.min(cappedGross, settings.threshold_monthly);
  if (lowPart > 0) {
    nationalInsurance += lowPart * settings.rate_low_employee;
    if (isResident) {
      healthTax += lowPart * settings.rate_low_health;
    }
  }

  // High part (above threshold)
  const highPart = Math.max(0, cappedGross - settings.threshold_monthly);
  if (highPart > 0) {
    nationalInsurance += highPart * settings.rate_high_employee;
    if (isResident) {
      healthTax += highPart * settings.rate_high_health;
    }
  }

  return {
    national_insurance: nationalInsurance,
    health_tax: healthTax,
    breakdown: {
      ni_breakdown: {
        low_part: lowPart * settings.rate_low_employee,
        high_part: highPart * settings.rate_high_employee,
      },
      health_breakdown: {
        low_part: isResident ? lowPart * settings.rate_low_health : 0,
        high_part: isResident ? highPart * settings.rate_high_health : 0,
      },
    },
  };
}

export function calculateSalary(input: CalculationInput): CalculationResult {
  const grossMonthly = input.gross_monthly + (input.bonus_current_month || 0);
  const grossAnnual = grossMonthly * 12; // For tax calculation purposes

  // Calculate income tax
  const { tax: annualTax, breakdown: taxBreakdown } = calculateIncomeTax(grossAnnual);
  const monthlyTaxBeforeCredits = annualTax / 12;

  // Calculate credit points
  const autoCreditPoints = calculateCreditPoints(input);
  const totalCreditPoints = autoCreditPoints + input.manual_credit_points;
  const creditValue = totalCreditPoints * TAX_SETTINGS_2025.credit_points.value_monthly;
  
  // Tax after credits (cannot be negative)
  const monthlyTaxAfterCredits = Math.max(0, monthlyTaxBeforeCredits - creditValue);

  // Calculate NI and Health
  const niAndHealth = calculateNationalInsuranceAndHealth(grossMonthly, input.is_resident);

  // Calculate totals
  const totalDeductions = monthlyTaxAfterCredits + niAndHealth.national_insurance + niAndHealth.health_tax;
  const net = grossMonthly - totalDeductions;

  // Employer cost (rough estimate)
  const employerNI = grossMonthly * 0.0361; // Simplified employer NI rate
  const employerCost = grossMonthly + employerNI;

  return {
    gross: grossMonthly,
    income_tax_before_credits: monthlyTaxBeforeCredits,
    credit_points: {
      auto: autoCreditPoints,
      manual: input.manual_credit_points,
      total: totalCreditPoints,
      value_monthly: TAX_SETTINGS_2025.credit_points.value_monthly,
      total_value: creditValue,
    },
    income_tax_after_credits: monthlyTaxAfterCredits,
    national_insurance: niAndHealth.national_insurance,
    health_tax: niAndHealth.health_tax,
    total_deductions: totalDeductions,
    net: net,
    employer_cost: employerCost,
    breakdown: {
      tax_by_bracket: taxBreakdown,
      ni_breakdown: niAndHealth.breakdown.ni_breakdown,
      health_breakdown: niAndHealth.breakdown.health_breakdown,
    },
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}