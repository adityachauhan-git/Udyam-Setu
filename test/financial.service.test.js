import assert from "node:assert/strict";
import test from "node:test";
import { calculateFinancialEligibility } from "../src/modules/financial/financial.service.js";

test("Micro Finance eligibility includes a 12-quarter repayment schedule", () => {
  const result = calculateFinancialEligibility({ marginCapital: 10000 });

  assert.equal(result.scheme.name, "Micro Finance Scheme");
  assert.equal(result.loanAmount, 90000);
  assert.equal(result.repaymentSchedule.length, 12);
  assert.deepEqual(result.repaymentSchedule[0], {
    quarterNumber: 1,
    status: "Moratorium",
    installmentAmount: 0,
    remainingLoanBalance: 90000,
  });
  assert.equal(result.repaymentSchedule.at(-1).remainingLoanBalance, 0);
});

test("Term Loan eligibility includes a 28-quarter repayment schedule", () => {
  const result = calculateFinancialEligibility({ marginCapital: 20000 });

  assert.equal(result.scheme.name, "Term Loan Scheme");
  assert.equal(result.loanAmount, 180000);
  assert.equal(result.repaymentSchedule.length, 28);
  assert.equal(result.repaymentSchedule[0].status, "Moratorium");
  assert.equal(result.repaymentSchedule[1].status, "Moratorium");
  assert.equal(result.repaymentSchedule[2].status, "Repayment");
  assert.equal(result.repaymentSchedule.at(-1).remainingLoanBalance, 0);
});
