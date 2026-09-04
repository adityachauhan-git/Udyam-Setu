import { AppError } from "../../common/errors/AppError.js";

const BENEFICIARY_MARGIN_RATE = 0.1;
const MAXIMUM_LOAN_RATE = 0.9;
const MICRO_FINANCE_MAXIMUM_PROJECT_COST = 140000;
const TERM_LOAN_MAXIMUM_PROJECT_COST = 5000000;

const microFinanceScheme = {
  name: "Micro Finance Scheme",
  interestRate: 0.065,
  tenureYears: 3,
  moratoriumMonths: 3,
  maximumAgencyFunding: 125000,
};

const termLoanScheme = {
  name: "Term Loan Scheme",
  interestRate: 0.08,
  tenureYears: 7,
  moratoriumMonths: 6,
  maximumAgencyFunding: 4500000,
};

function validateMarginCapital(value) {
  const marginCapital = Number(value);
  if (value == null || value === "" || !Number.isFinite(marginCapital) || marginCapital <= 0) {
    throw new AppError("Margin capital must be a positive number", 400);
  }
  return marginCapital;
}

function getScheme(projectCost) {
  if (projectCost <= MICRO_FINANCE_MAXIMUM_PROJECT_COST) return microFinanceScheme;
  if (projectCost <= TERM_LOAN_MAXIMUM_PROJECT_COST) return termLoanScheme;
  return null;
}

function getRepaymentQuarterCount(tenureYears, moratoriumMonths) {
  const totalQuarters = tenureYears * 4;
  const moratoriumQuarters = Math.ceil(moratoriumMonths / 3);
  return totalQuarters - moratoriumQuarters;
}

export function calculateQuarterlyInstallment({
  loanAmount,
  interestRate,
  tenureYears,
  moratoriumMonths,
}) {
  const repaymentQuarters = getRepaymentQuarterCount(tenureYears, moratoriumMonths);
  const quarterlyInterestRate = interestRate / 4;

  if (quarterlyInterestRate === 0) return loanAmount / repaymentQuarters;

  const growthFactor = (1 + quarterlyInterestRate) ** repaymentQuarters;
  return loanAmount * quarterlyInterestRate * growthFactor / (growthFactor - 1);
}

export function generateRepaymentSchedule({
  loanAmount,
  interestRate,
  tenureYears,
  moratoriumMonths,
}) {
  const totalQuarters = tenureYears * 4;
  const moratoriumQuarters = Math.ceil(moratoriumMonths / 3);
  const quarterlyInstallment = calculateQuarterlyInstallment({
    loanAmount,
    interestRate,
    tenureYears,
    moratoriumMonths,
  });
  const quarterlyInterestRate = interestRate / 4;
  let remainingLoanBalance = loanAmount;

  return Array.from({ length: totalQuarters }, (_, index) => {
    const quarterNumber = index + 1;
    const isMoratorium = quarterNumber <= moratoriumQuarters;

    if (!isMoratorium) {
      const interest = remainingLoanBalance * quarterlyInterestRate;
      const principalPaid = quarterlyInstallment - interest;
      remainingLoanBalance -= principalPaid;

      if (quarterNumber === totalQuarters) remainingLoanBalance = 0;
    }

    return {
      quarterNumber,
      status: isMoratorium ? "Moratorium" : "Repayment",
      installmentAmount: isMoratorium ? 0 : quarterlyInstallment,
      remainingLoanBalance,
    };
  });
}

export function calculateFinancialEligibility(input = {}) {
  const marginCapital = validateMarginCapital(input.marginCapital);
  const projectCost = marginCapital / BENEFICIARY_MARGIN_RATE;
  const maximumLoan = projectCost * MAXIMUM_LOAN_RATE;
  const scheme = getScheme(projectCost);

  const repayment = scheme && {
    loanAmount: maximumLoan,
    interestRate: scheme.interestRate,
    tenureYears: scheme.tenureYears,
    moratoriumMonths: scheme.moratoriumMonths,
  };

  return {
    marginCapital,
    beneficiaryMarginRate: BENEFICIARY_MARGIN_RATE,
    projectCost,
    maximumLoan,
    eligible: scheme !== null,
    scheme,
    ...(repayment && {
      ...repayment,
      quarterlyInstallment: calculateQuarterlyInstallment(repayment),
      repaymentSchedule: generateRepaymentSchedule(repayment),
    }),
  };
}
