export interface PayslipData {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  employeeName: string;
  designation: string;
  payPeriod: string;
  incomeSummary: {
    grossSalary: number;
    netSalary: number;
    taxDeduction: number;
    otherDeductions: number;
  };
  breakdown: {
    earnings: { item: string; amount: number }[];
    deductions: { item: string; amount: number }[];
  };
  insights: {
    type: "AI Insight" | "Observation" | "Potential Opportunity" | "Suggested Action";
    title: string;
    description: string;
    impact?: string;
  }[];
}

export const MOCK_PAYSLIP_RESULT: PayslipData = {
  fileName: "Salary_Slip_August_2026.pdf",
  fileSize: "1.4 MB",
  uploadedAt: "Just now",
  employeeName: "Anuj Kumar Singh",
  designation: "VP, Quantitative Strategies & Systems",
  payPeriod: "August 2026",
  incomeSummary: {
    grossSalary: 185000,
    netSalary: 138400,
    taxDeduction: 32600,
    otherDeductions: 14000,
  },
  breakdown: {
    earnings: [
      { item: "Basic Salary", amount: 85000 },
      { item: "House Rent Allowance (HRA)", amount: 42500 },
      { item: "Special Allowance", amount: 37500 },
      { item: "Performance Bonus / LTA", amount: 20000 },
    ],
    deductions: [
      { item: "Tax Deducted at Source (TDS)", amount: 32600 },
      { item: "Employee Provident Fund (EPF)", amount: 10200 },
      { item: "Voluntary Insurance / Medical", amount: 3600 },
      { item: "Professional Tax", amount: 200 },
    ],
  },
  insights: [
    {
      type: "AI Insight",
      title: "Tax Regime Assessment",
      description: "TDS is deducted under the Section 115BAC New Tax Regime with ₹75,000 standard deduction reflected.",
      impact: "Current effective tax rate: 17.62%",
    },
    {
      type: "Observation",
      title: "Statutory Retirement Contribution",
      description: "EPF deduction of ₹10,200/mo accumulates ₹1,22,400 annually with guaranteed 8.25% sovereign interest.",
      impact: "Zero market risk retirement asset",
    },
    {
      type: "Potential Opportunity",
      title: "NPS Tier-1 Additional Deduction",
      description: "Investing ₹50,000 annually under Section 80CCD(1B) could optimize ₹15,600 in tax if evaluated under eligible tax slabs.",
      impact: "Potential ₹1,300/mo tax efficiency",
    },
    {
      type: "Suggested Action",
      title: "Liquidity Buffer Calibration",
      description: "Allocate 6 months of net take-home salary (₹8,30,400) across liquid debt funds and high-yield treasury repos before taking excess equity exposure.",
      impact: "Protects against drawdowns",
    },
  ],
};
