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

export const MOCK_PAYSLIP_RESULT: PayslipData | null = null;

