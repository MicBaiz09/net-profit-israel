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

// Standard Israeli contribution rates for 2025
export const STANDARD_CONTRIBUTIONS_2025 = {
  pension: {
    employee_rate: 0.07, // 7%
    employer_rate: 0.0833, // 8.33%
    base_salary_only: false,
  } as PensionContributions,
  
  study_fund: {
    employee_rate: 0.025, // 2.5%
    employer_rate: 0.075, // 7.5%
    base_salary_only: true, // Usually applied to base salary only
  } as StudyFundContributions,
};

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

export interface PensionContributions {
  employee_rate: number; // e.g., 0.07 for 7%
  employer_rate: number; // e.g., 0.0833 for 8.33%
  base_salary_only: boolean; // whether to apply only to base salary or total
}

export interface StudyFundContributions {
  employee_rate: number; // e.g., 0.025 for 2.5%
  employer_rate: number; // e.g., 0.075 for 7.5%
  base_salary_only: boolean;
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
  
  // Pension contributions
  use_standard_pension: boolean;
  custom_pension?: PensionContributions;
  
  // Study fund contributions
  use_study_fund: boolean;
  custom_study_fund?: StudyFundContributions;
  
  // Manual deductions
  manual_deductions_monthly?: number;
}

export interface CalculationResult {
  gross: number;
  taxable_income: number; // After pension contributions
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
  
  // Contributions
  pension_employee: number;
  study_fund_employee: number;
  manual_deductions: number;
  
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
    contributions: {
      pension_employee: number;
      pension_employer: number;
      study_fund_employee: number;
      study_fund_employer: number;
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

export function calculateContributions(grossMonthly: number, input: CalculationInput) {
  let pensionEmployee = 0;
  let pensionEmployer = 0;
  let studyFundEmployee = 0;
  let studyFundEmployer = 0;
  
  // Pension contributions
  if (input.use_standard_pension || input.custom_pension) {
    const pensionSettings = input.custom_pension || STANDARD_CONTRIBUTIONS_2025.pension;
    const pensionBase = pensionSettings.base_salary_only ? input.gross_monthly : grossMonthly;
    
    pensionEmployee = pensionBase * pensionSettings.employee_rate;
    pensionEmployer = pensionBase * pensionSettings.employer_rate;
  }
  
  // Study fund contributions
  if (input.use_study_fund || input.custom_study_fund) {
    const studyFundSettings = input.custom_study_fund || STANDARD_CONTRIBUTIONS_2025.study_fund;
    const studyFundBase = studyFundSettings.base_salary_only ? input.gross_monthly : grossMonthly;
    
    studyFundEmployee = studyFundBase * studyFundSettings.employee_rate;
    studyFundEmployer = studyFundBase * studyFundSettings.employer_rate;
  }
  
  return {
    pension_employee: pensionEmployee,
    pension_employer: pensionEmployer,
    study_fund_employee: studyFundEmployee,
    study_fund_employer: studyFundEmployer,
  };
}

export function calculateSalary(input: CalculationInput): CalculationResult {
  const grossMonthly = input.gross_monthly + (input.bonus_current_month || 0);
  
  // Calculate contributions
  const contributions = calculateContributions(grossMonthly, input);
  
  // Manual deductions
  const manualDeductions = input.manual_deductions_monthly || 0;
  
  // Taxable income (after pension deductions)
  const taxableMonthly = grossMonthly - contributions.pension_employee;
  const taxableAnnual = taxableMonthly * 12;

  // Calculate income tax on taxable income
  const { tax: annualTax, breakdown: taxBreakdown } = calculateIncomeTax(taxableAnnual);
  const monthlyTaxBeforeCredits = annualTax / 12;

  // Calculate credit points
  const autoCreditPoints = calculateCreditPoints(input);
  const totalCreditPoints = autoCreditPoints + input.manual_credit_points;
  const creditValue = totalCreditPoints * TAX_SETTINGS_2025.credit_points.value_monthly;
  
  // Tax after credits (cannot be negative)
  const monthlyTaxAfterCredits = Math.max(0, monthlyTaxBeforeCredits - creditValue);

  // Calculate NI and Health (on gross before pension)
  const niAndHealth = calculateNationalInsuranceAndHealth(grossMonthly, input.is_resident);

  // Calculate totals
  const totalDeductions = monthlyTaxAfterCredits + 
                         niAndHealth.national_insurance + 
                         niAndHealth.health_tax + 
                         contributions.pension_employee + 
                         contributions.study_fund_employee + 
                         manualDeductions;
  const net = grossMonthly - totalDeductions;

  // Employer cost
  const employerNI = grossMonthly * 0.0361; // Simplified employer NI rate
  const employerCost = grossMonthly + employerNI + contributions.pension_employer + contributions.study_fund_employer;

  return {
    gross: grossMonthly,
    taxable_income: taxableMonthly,
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
    pension_employee: contributions.pension_employee,
    study_fund_employee: contributions.study_fund_employee,
    manual_deductions: manualDeductions,
    total_deductions: totalDeductions,
    net: net,
    employer_cost: employerCost,
    breakdown: {
      tax_by_bracket: taxBreakdown,
      ni_breakdown: niAndHealth.breakdown.ni_breakdown,
      health_breakdown: niAndHealth.breakdown.health_breakdown,
      contributions: contributions,
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