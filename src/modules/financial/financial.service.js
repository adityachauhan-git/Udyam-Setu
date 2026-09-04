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

export function calculateFinancialEligibility(input = {}) {
  const marginCapital = validateMarginCapital(input.marginCapital);
  const projectCost = marginCapital / BENEFICIARY_MARGIN_RATE;
  const maximumLoan = projectCost * MAXIMUM_LOAN_RATE;
  const scheme = getScheme(projectCost);

  return {
    marginCapital,
    beneficiaryMarginRate: BENEFICIARY_MARGIN_RATE,
    projectCost,
    maximumLoan,
    eligible: scheme !== null,
    scheme,
  };
}