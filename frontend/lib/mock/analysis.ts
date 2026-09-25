import { MultiAgentScenario, AnalysisHistoryRecord } from "@/types/analysis";

export const MOCK_MULTI_AGENT_SCENARIOS: MultiAgentScenario[] = [
  {
    id: "scenario-rbi-rate",
    title: "RBI Monetary Stance Shift & Multi-Asset Portfolio Sensitivity",
    description: "Evaluates how a potential 25bps repo rate adjustment by the Reserve Bank of India impacts equity multiples, sovereign bond yields, and banking sector margins.",
    category: "Macroeconomic",
    userPrompt: "Analyze the impact of an RBI rate hike or pause on my portfolio.",
    involvedAgentIds: ["macro", "news", "risk", "portfolio", "investment"],
    signals: [
      {
        agentId: "macro",
        agentName: "Macro Economy Agent",
        verdict: "Optimized",
        confidence: 91,
        finding: "RBI likely to hold repo rate at 6.50% before initiating calibrated 25bps cut as core CPI hits 3.8%.",
        rationale: "Favorable monsoon dynamics and cooling vegetable prices keep inflation trajectory well within the 4.0% +/- 2% mandate.",
        timestamp: "10:14:02 IST",
        dataPoint: "Core CPI: 3.8% | Yield: 7.18%",
      },
      {
        agentId: "news",
        agentName: "News Agent",
        verdict: "Bullish",
        confidence: 88,
        finding: "Governor statements and analyst consensus signal liquidity normalization rather than monetary tightening.",
        rationale: "Analysis of 142 post-meeting commentary articles indicates 82% institutional expectation of stable lending rates.",
        timestamp: "10:14:08 IST",
        dataPoint: "Media Sentiment: +0.64 (Favorable)",
      },
      {
        agentId: "risk",
        agentName: "Risk Agent",
        verdict: "Low Risk",
        confidence: 94,
        finding: "Portfolio duration is insulated; rate hike would increase daily 95% VaR by only ₹8,400 (negligible).",
        rationale: "Fixed-income component is heavily concentrated in short/medium sovereign tenors with minimal high-yield credit spread risk.",
        timestamp: "10:14:15 IST",
        dataPoint: "Duration: 3.8 yrs | Delta VaR: +0.09%",
      },
      {
        agentId: "portfolio",
        agentName: "Portfolio Agent",
        verdict: "Bullish",
        confidence: 96,
        finding: "HDFC Bank (20.8% weight) exhibits positive net interest margin sensitivity to steady rates.",
        rationale: "Equity allocation has strong pricing power and low leverage, with aggregate debt-to-equity ratio under 0.35x.",
        timestamp: "10:14:21 IST",
        dataPoint: "Banking Exposure: 20.8% | D/E: 0.35",
      },
      {
        agentId: "investment",
        agentName: "Investment Agent",
        verdict: "Bullish",
        confidence: 92,
        finding: "Recommends maintaining current equity allocation while incrementally extending duration on G-Secs.",
        rationale: "Rate stability supports corporate earnings momentum; locking in >7.15% sovereign yields offers favorable risk-free compounding.",
        timestamp: "10:14:29 IST",
        dataPoint: "Target Yield: 7.18% | Equity Upside: +8.4%",
      },
    ],
    conflictResolution: {
      conflictDescription: "Macro Agent favored immediate yield lock-in, whereas Risk Agent cautioned against premature duration extension past 5 years.",
      resolutionExplanation: "Decision Engine reconciled the duration target to 3.8 - 4.2 years, capturing attractive yields while preventing mark-to-market volatility.",
      reconciledScore: 94,
    },
    consensusVerdict: "Constructive & Insulated — Maintain Equity Overweight, Extend Bond Tenor Moderately",
    consensusScore: 93,
    riskLevel: "Low",
    unifiedInsights: [
      "Your current portfolio structure is resilient against RBI rate volatility with only 17.2% exposed to fixed income duration.",
      "HDFC Bank and TCS generate robust operational cash flows that benefit from steady borrowing costs and corporate expansion.",
      "Locking in 7.18% yields on GOVT-BOND-2034 provides safe asset-liability matching without diluting total portfolio return.",
      "No urgent portfolio restructuring or tax-loss selling is required; asset allocation remains in the institutional green zone.",
    ],
    actionPlan: {
      immediate: [
        "Maintain current equity weighting at 72.3% with focus on high-ROIC compounders.",
        "Reinvest upcoming coupon proceeds into sovereign 10-year G-Sec tranches.",
      ],
      mediumTerm: [
        "Monitor upcoming MPC voting split (scheduled Oct 9).",
        "Trigger Tax Agent review if equity capital gains cross ₹1.25L threshold.",
      ],
    },
    explainability: {
      graphRAGContext: "Knowledge Graph traversed 42 nodes linking RBI MPC policy -> HDFC Net Interest Margin -> G-Sec Sovereign Spread -> Portfolio Value at Risk.",
      decisionEngineWeighting: [
        { agent: "Macro Economy Agent", weight: 0.28 },
        { agent: "Risk Agent", weight: 0.25 },
        { agent: "Portfolio Agent", weight: 0.22 },
        { agent: "Investment Agent", weight: 0.15 },
        { agent: "News Agent", weight: 0.10 },
      ],
      auditId: "FINOS-AUDIT-2026-0925-A8F4",
    },
  },
  {
    id: "scenario-semiconductor-shock",
    title: "Global Semiconductor Export Controls & Tech Exposure Sensitivity",
    description: "Evaluates the ripple effect of geopolitical semiconductor restrictions on NVIDIA holdings and Indian IT system integrators.",
    category: "Earnings & Tech",
    userPrompt: "Assess the risk of US-China chip export restrictions on my tech positions.",
    involvedAgentIds: ["investment", "risk", "news", "trading", "portfolio"],
    signals: [
      {
        agentId: "news",
        agentName: "News Agent",
        verdict: "High Risk",
        confidence: 86,
        finding: "Commerce Department tightening thresholds on advanced GPU exports to middle-tier markets.",
        rationale: "Regulatory drafts indicate stricter compute-density limitations that could shave 3-5% from near-term hardware delivery pipeline.",
        timestamp: "11:20:10 IST",
        dataPoint: "Policy Severity: High | Media Index: -0.42",
      },
      {
        agentId: "investment",
        agentName: "Investment Agent",
        verdict: "Neutral",
        confidence: 89,
        finding: "NVIDIA enterprise software and sovereign AI cloud contracts offset hardware restriction headwinds.",
        rationale: "Hyperscaler demand in North America and Western Europe remains supply-constrained through 2027.",
        timestamp: "11:20:18 IST",
        dataPoint: "Backlog: 18 Months | Forward P/E: 32x",
      },
      {
        agentId: "portfolio",
        agentName: "Portfolio Agent",
        verdict: "Rebalance Required",
        confidence: 94,
        finding: "Total tech exposure across TCS (21.4%) and NVDA (10.2%) is 31.6% — approaching concentration boundary.",
        rationale: "While TCS provides stable services annuity, combined tech volatility could increase portfolio drawdown during tech pullbacks.",
        timestamp: "11:20:25 IST",
        dataPoint: "Tech Concentration: 31.6% (Limit: 35%)",
      },
      {
        agentId: "trading",
        agentName: "Trading Agent",
        verdict: "Optimized",
        confidence: 92,
        finding: "Execution liquidity in NVDA and TCS is exceptional; limit orders can trim exposure with <0.02% slippage.",
        rationale: "Average daily turnover exceeds $40B for NVDA and ₹1,800Cr for TCS, facilitating seamless algorithmic scaling.",
        timestamp: "11:20:31 IST",
        dataPoint: "Liquidity Depth: 9.8/10 | Spread: 1.2 bps",
      },
      {
        agentId: "risk",
        agentName: "Risk Agent",
        verdict: "High Risk",
        confidence: 95,
        finding: "Recommend trailing stop guardrail at $122.00 for NVDA to protect +20.98% unrealized profit.",
        rationale: "Historical 90-day drawdown analysis shows chip sector corrections average 12-16% when regulatory announcements hit.",
        timestamp: "11:20:40 IST",
        dataPoint: "Stop Level: $122.00 | Beta: 1.48",
      },
    ],
    consensusVerdict: "Controlled Exposure — Set Trailing Stop on NVIDIA, Hold TCS Core",
    consensusScore: 89,
    riskLevel: "Moderate",
    unifiedInsights: [
      "Total technology allocation is 31.6%, remaining within the 35% institutional risk ceiling.",
      "TCS has negligible direct hardware exposure; enterprise AI software integration contracts provide multi-year earnings visibility.",
      "Setting a smart trailing stop at $122 on NVDA secures over ₹1.2L in accumulated capital gains without prematurely exiting structural alpha.",
    ],
    actionPlan: {
      immediate: [
        "Activate automated trailing stop loss at $122 for NVDA via Trading Agent hooks.",
        "Maintain TCS position with ongoing monitoring of US BFSI client spending.",
      ],
      mediumTerm: [
        "Consider reallocating partial profit taking into Sovereign Gold ETF or domestic healthcare.",
      ],
    },
    explainability: {
      graphRAGContext: "Linked BIS export guidelines -> GPU foundry supply chain -> Hyperscaler CapEx -> TCS Cloud Transformation pipeline.",
      decisionEngineWeighting: [
        { agent: "Risk Agent", weight: 0.32 },
        { agent: "Investment Agent", weight: 0.28 },
        { agent: "Portfolio Agent", weight: 0.20 },
        { agent: "News Agent", weight: 0.12 },
        { agent: "Trading Agent", weight: 0.08 },
      ],
      auditId: "FINOS-AUDIT-2026-0925-C1B9",
    },
  },
];

export const MOCK_ANALYSIS_RECORDS: AnalysisHistoryRecord[] = [
  {
    id: "reliance-industries",
    title: "Reliance Industries",
    query: "Analyze Reliance Industries stock outlook and refining margin trajectory",
    type: "Stocks",
    agentsUsed: ["Investment", "News", "Risk"],
    date: "2 min ago",
    timestamp: "2026-09-25T13:45:00Z",
    status: "Completed",
    summary: "Multi-agent consensus indicates bullish long-term upside (+14.2%) driven by retail expansion and telecom 5G monetization, partially balanced by short-term Singapore gross refining margin (GRM) compression.",
    keyFindings: [
      "Jio Platforms 5G subscriber migration and recent tariff adjustments provide predictable double-digit ARPU expansion.",
      "Reliance Retail registered 18% YoY footprint growth, with quick-commerce fulfillment scaling to 45 urban nodes.",
      "Singapore complex GRMs eased slightly to $5.4/bbl, creating transient near-term headwinds in the O2C downstream chemical division.",
      "Net debt-to-EBITDA remains sound at 0.72x with strong cash flow support across consumer segments."
    ],
    marketInfo: {
      symbol: "RELIANCE.NS",
      price: "₹2,984.50",
      change: "+₹32.40 (+1.10%)",
      peRatio: "26.4x",
      marketCap: "₹20.19 Lakh Cr",
      volume: "4.82M"
    },
    news: [
      {
        headline: "Reliance Retail accelerates dark store infrastructure for quick commerce rollout",
        sentiment: "Positive",
        source: "Mint",
        time: "1 hour ago"
      },
      {
        headline: "Asian refiners monitor Red Sea shipping freight routes and crack spreads",
        sentiment: "Neutral",
        source: "Bloomberg",
        time: "3 hours ago"
      },
      {
        headline: "Jio Infocomm reports accelerated enterprise 5G private network deployments",
        sentiment: "Positive",
        source: "Economic Times",
        time: "5 hours ago"
      }
    ],
    riskFactors: [
      {
        factor: "Refining Margin Volatility",
        impact: "Medium",
        description: "Downstream petrochemical realizations are sensitive to global demand softening in European export destinations."
      },
      {
        factor: "Renewable Capex Gestation",
        impact: "Low",
        description: "Jamnagar giga-factory investments have an extended capital expenditure cycle before positive operating cash flows materialize."
      }
    ],
    investmentInsights: [
      "Sum-Of-The-Parts (SOTP) valuation yields an institutional target price of ₹3,350 (+12.2% upside potential).",
      "Consensus recommendation is Accumulate on pullbacks with a disciplined stop-loss benchmarked at ₹2,820."
    ],
    agentContributions: [
      {
        agent: "Investment Agent",
        role: "Fundamental SOTP valuation and multiple benchmarking",
        insight: "Estimated fair value at ₹3,350; retail multiple justified at 34x EV/EBITDA given market leadership.",
        confidence: 92
      },
      {
        agent: "News Agent",
        role: "NLP sentiment extraction across 180 media sources",
        insight: "Media sentiment score +0.68 (Bullish); management execution confidence remains elevated.",
        confidence: 88
      },
      {
        agent: "Risk Agent",
        role: "Factor sensitivity and VaR simulation",
        insight: "Beta stands at 1.04; portfolio 95% 1-day VaR increases by negligible ₹12,400 if allocated.",
        confidence: 95
      }
    ],
    suggestedActions: [
      "Scale into position between ₹2,900 and ₹2,940.",
      "Monitor quarterly ARPU trajectory from the telecom division.",
      "Set an automated trailing stop-loss at ₹2,820."
    ]
  },
  {
    id: "portfolio-risk",
    title: "Portfolio Risk Analysis",
    query: "Analyze my portfolio risk, 99% VaR and factor exposure across tech holdings",
    type: "Portfolio",
    agentsUsed: ["Risk", "Portfolio", "Investment"],
    date: "25 min ago",
    timestamp: "2026-09-25T13:20:00Z",
    status: "Completed",
    summary: "Overall portfolio risk is healthy with 95% 1-day VaR of ₹1.42L (1.6% of NAV). However, aggregate tech weighting across TCS and NVIDIA is 31.6%, approaching the 35% single-sector risk ceiling.",
    keyFindings: [
      "Portfolio aggregate beta is 0.88 with maximum historical drawdown constrained to -6.4% over 12 months.",
      "Tech concentration in TCS (21.4%) and NVIDIA (10.2%) totals 31.6% of NAV.",
      "Fixed income allocation in Sovereign G-Secs (17.2%) acts as an effective duration stabilizer.",
      "Liquidity score is 9.4/10; 92% of the portfolio can be liquidated within 1 trading session with under 0.05% market impact."
    ],
    marketInfo: {
      price: "₹12,45,000 NAV",
      change: "+₹18,420 (+1.50%)",
      volume: "8 Assets"
    },
    news: [
      {
        headline: "Indian sovereign yields remain anchored following robust tax collection data",
        sentiment: "Positive",
        source: "Financial Express",
        time: "2 hours ago"
      }
    ],
    riskFactors: [
      {
        factor: "Tech Sector Concentration",
        impact: "Medium",
        description: "Exposure is 31.6% vs 35.0% threshold. Tech pullbacks could drag NAV."
      },
      {
        factor: "Currency Fluctuations (USD/INR)",
        impact: "Low",
        description: "NVIDIA USD denominated exposure is partially offset by INR sovereign yields."
      }
    ],
    investmentInsights: [
      "Direct incremental monthly savings toward sovereign debt or large-cap domestic FMCG.",
      "Activate automated trailing stops on NVIDIA at $122 to lock in unrealized capital gains."
    ],
    agentContributions: [
      {
        agent: "Risk Agent",
        role: "Monte Carlo VaR & factor stress testing",
        insight: "99% 1-day VaR stands at ₹2.18L; portfolio passes 2008 Lehman and 2020 COVID stress tests.",
        confidence: 96
      },
      {
        agent: "Portfolio Agent",
        role: "Sector concentration and rebalancing audit",
        insight: "Sector allocation requires slight trim from IT to BFSI or sovereign debt to optimize Sharpe ratio.",
        confidence: 94
      },
      {
        agent: "Investment Agent",
        role: "Alpha generation and rebalancing advisory",
        insight: "Maintain core TCS holding while harvesting fractional NVIDIA gains on strength above $135.",
        confidence: 91
      }
    ],
    suggestedActions: [
      "Direct upcoming dividend and coupon cashflows into Sovereign G-Sec 2034.",
      "Review trailing stop at $122 for NVIDIA holding.",
      "Keep cash reserve at 5.4% for tactical opportunistic deployments."
    ]
  },
  {
    id: "rbi-rate",
    title: "RBI Rate Hike Impact",
    query: "Assess the impact of an RBI rate hike or pause on my portfolio",
    type: "Markets",
    agentsUsed: ["Macro Economy", "News", "Risk"],
    date: "2 hours ago",
    timestamp: "2026-09-25T11:45:00Z",
    status: "Completed",
    summary: "RBI is widely projected to hold repo rate at 6.50% before considering a calibrated 25bps cut. Portfolio duration is well-insulated with minimal rate hike sensitivity.",
    keyFindings: [
      "Core retail inflation softened to 3.8%, well within the RBI's target band of 4% +/- 2%.",
      "Banking weight in HDFC Bank (20.8%) benefits from steady net interest margins and robust credit expansion.",
      "Sovereign 10-year benchmark bond yield is stable at 7.18%, offering attractive real yields."
    ],
    news: [
      {
        headline: "RBI Governor emphasizes balanced growth-inflation dynamics ahead of MPC meeting",
        sentiment: "Neutral",
        source: "PTI",
        time: "4 hours ago"
      }
    ],
    riskFactors: [
      {
        factor: "US Treasury Yield Spillovers",
        impact: "Medium",
        description: "Prolonged high US rates may limit RBI room for aggressive monetary easing."
      }
    ],
    investmentInsights: [
      "Locking in >7.15% sovereign yields offers strong risk-free compounding.",
      "Banking equities remain structurally attractive with return on equity above 16%."
    ],
    agentContributions: [
      {
        agent: "Macro Economy Agent",
        role: "Central bank statement NLP and macroeconomic forecasting",
        insight: "82% probability of rate pause; liquidity conditions normalizing smoothly.",
        confidence: 91
      },
      {
        agent: "News Agent",
        role: "Media narrative analysis",
        insight: "142 post-meeting commentary articles indicate favorable institutional policy sentiment.",
        confidence: 88
      },
      {
        agent: "Risk Agent",
        role: "Duration risk modeling",
        insight: "Delta VaR for +25bps scenario is only ₹8,400; duration risk is tightly contained.",
        confidence: 94
      }
    ],
    suggestedActions: [
      "Maintain equity allocation with overweight on private banks.",
      "Extend debt duration to 4.0 years on sovereign bonds.",
      "Monitor MPC voting minutes released post-meeting."
    ]
  },
  {
    id: "payslip-analysis",
    title: "Payslip Analysis",
    query: "Analyze August 2026 payslip for deductions and tax regime optimization",
    type: "Payslip",
    agentsUsed: ["Tax", "Portfolio"],
    date: "Yesterday",
    timestamp: "2026-09-24T09:15:00Z",
    status: "Completed",
    summary: "Parsed August 2026 payslip: Gross salary ₹1,45,000, Total deductions ₹26,500, Net salary ₹1,18,500. New Tax Regime (Section 115BAC) delivers ₹14,200 lower annual tax liability compared to Old Regime.",
    keyFindings: [
      "Gross monthly earnings: ₹1,45,000 (Basic: ₹65,000, HRA: ₹28,000, Special Allowance: ₹32,000, Bonus: ₹20,000).",
      "Statutory deductions: PF: ₹7,800, Professional Tax: ₹200, TDS: ₹18,500.",
      "New Tax Regime saves ₹14,200 annually over Old Regime given current deduction profile.",
      "NPS Section 80CCD(1B) contribution can unlock additional ₹50,000 tax deduction if using Old Regime."
    ],
    marketInfo: {
      price: "₹1,18,500 / mo",
      change: "Net Take-Home"
    },
    riskFactors: [
      {
        factor: "Tax Regime Lock-in",
        impact: "Low",
        description: "Salaried individuals can switch regimes annually at ITR filing time."
      }
    ],
    investmentInsights: [
      "Recommended monthly surplus allocation: 50% Equity Index, 30% Debt/PPF, 20% Emergency Liquid Fund."
    ],
    agentContributions: [
      {
        agent: "Tax Agent",
        role: "Income tax computation under Sec 115BAC vs Old Regime",
        insight: "New Regime liability ₹1,22,400 vs Old Regime ₹1,36,600. Clear tax savings under New Regime.",
        confidence: 97
      },
      {
        agent: "Portfolio Agent",
        role: "Net savings rate and cashflow matching",
        insight: "Discretionary cashflow after EMI/rent is ₹54,000/month available for systematic investment.",
        confidence: 93
      }
    ],
    suggestedActions: [
      "Confirm New Tax Regime declaration with employer HR payroll portal.",
      "Setup automated SIP on salary disbursement date (1st of each month).",
      "Archive PDF payslip in FinOS Document Vault."
    ]
  },
  {
    id: "gold-price-trend",
    title: "Gold Price Trend",
    query: "Evaluate gold price trajectory and sovereign gold bonds as macro hedge",
    type: "Markets",
    agentsUsed: ["Macro Economy", "Trading", "News"],
    date: "2 days ago",
    timestamp: "2026-09-23T14:30:00Z",
    status: "Completed",
    summary: "Gold (10g) at ₹75,420 exhibits strong secular support from central bank reserve diversification and geopolitical insurance demand.",
    keyFindings: [
      "Global central banks accumulated over 480 tonnes of gold year-to-date.",
      "Gold provides zero correlation to NIFTY 50 (-0.04 factor correlation), significantly reducing overall portfolio volatility.",
      "Sovereign Gold Bonds offer 2.5% annual coupon plus complete tax exemption on capital gains at maturity."
    ],
    marketInfo: {
      symbol: "GOLD-10G",
      price: "₹75,420",
      change: "+₹280 (+0.37%)",
      volume: "12.4K Lots"
    },
    riskFactors: [
      {
        factor: "US Dollar Strength",
        impact: "Medium",
        description: "A sharp dollar rally could temporarily cap international bullion spot prices."
      }
    ],
    investmentInsights: [
      "Maintain a 7-10% portfolio weighting in gold instruments as a structural risk shock absorber."
    ],
    agentContributions: [
      {
        agent: "Macro Economy Agent",
        role: "Global liquidity and reserve analysis",
        insight: "Bullish fundamental backdrop backed by de-dollarization and reserve accumulation.",
        confidence: 90
      },
      {
        agent: "Trading Agent",
        role: "Technical breakout and support zone scan",
        insight: "Firm support established at ₹73,800 with next technical resistance at ₹77,500.",
        confidence: 87
      }
    ],
    suggestedActions: [
      "Hold existing Sovereign Gold Bond tranches until full redemption.",
      "Avoid leveraged gold derivatives; accumulate via gold ETFs on minor dips."
    ]
  },
  {
    id: "tcs-outlook",
    title: "TCS Outlook",
    query: "Assess Tata Consultancy Services Q3 earnings quality and US BFSI demand",
    type: "Stocks",
    agentsUsed: ["Investment", "News", "Trading"],
    date: "3 days ago",
    timestamp: "2026-09-22T10:10:00Z",
    status: "Completed",
    summary: "TCS demonstrates industry-leading operating margin resilience (25.8%) and a $10.2B quarterly total contract value (TCV) pipeline.",
    keyFindings: [
      "BFSI vertical in North America shows initial discretionary spending recovery in cloud modernization.",
      "Attrition dropped to a multi-year low of 11.2%, curbing sub-contractor wage pressures.",
      "Free cash conversion ratio stands above 100% of net income, supporting generous dividend payouts."
    ],
    marketInfo: {
      symbol: "TCS.NS",
      price: "₹4,120.00",
      change: "+₹28.50 (+0.70%)",
      peRatio: "29.8x",
      marketCap: "₹14.9 Lakh Cr"
    },
    riskFactors: [
      {
        factor: "Global IT Spend Delays",
        impact: "Medium",
        description: "Prolonged decision cycles for large transformative deals could moderate growth rates."
      }
    ],
    investmentInsights: [
      "High conviction core holding with 18% ROE and reliable 2.4% dividend yield.",
      "Target price ₹4,550 based on 31x forward FY27 EPS."
    ],
    agentContributions: [
      {
        agent: "Investment Agent",
        role: "Earnings quality & margin durability analysis",
        insight: "Operating margins remain best-in-class; earnings growth expected at 11% CAGR.",
        confidence: 93
      },
      {
        agent: "Trading Agent",
        role: "Institutional volume profile & support levels",
        insight: "Strong institutional accumulation above ₹4,050 support base.",
        confidence: 89
      }
    ],
    suggestedActions: [
      "Hold current position as anchor IT allocation.",
      "Reinvest dividends into broader index."
    ]
  },
  {
    id: "tax-saving-analysis",
    title: "Tax Saving Analysis",
    query: "Identify capital gains tax-loss harvesting candidates before fiscal quarter-end",
    type: "Tax",
    agentsUsed: ["Tax", "Portfolio"],
    date: "4 days ago",
    timestamp: "2026-09-21T15:00:00Z",
    status: "Completed",
    summary: "Identified ₹62,400 in net harvestable short-term losses that can legally offset short-term capital gains, saving ₹12,480 in direct taxes under Section 112A.",
    keyFindings: [
      "Two small-cap holdings currently trade at unrealized short-term loss of ₹62,400.",
      "Offsetting realized STCG reduces total tax liability by ₹12,480 at the 20% applicable rate.",
      "Reinvestment can be redirected into broad large-cap ETFs to maintain target equity exposure without violating anti-avoidance provisions."
    ],
    riskFactors: [
      {
        factor: "Market Timing on Re-entry",
        impact: "Low",
        description: "Simultaneous purchase of correlated ETF eliminates cash drag and market missing risk."
      }
    ],
    investmentInsights: [
      "Systematic tax-loss harvesting can boost after-tax portfolio CAGR by 0.6% annually."
    ],
    agentContributions: [
      {
        agent: "Tax Agent",
        role: "Income Tax Act Section 112A / 111A audit",
        insight: "Eligible lot identification complete; no wash-sale concerns under Indian tax regulations.",
        confidence: 96
      }
    ],
    suggestedActions: [
      "Execute loss realization orders before end of Q3.",
      "Simultaneously deploy proceeds into Nifty BeES ETF."
    ]
  },
  {
    id: "market-outlook-q4",
    title: "Market Outlook",
    query: "Macroeconomic outlook for Indian and global equities for the coming quarter",
    type: "Markets",
    agentsUsed: ["Macro Economy", "News", "Trading"],
    date: "5 days ago",
    timestamp: "2026-09-20T12:00:00Z",
    status: "Completed",
    summary: "Indian equities supported by strong domestic SIP inflows (₹22,000 Cr/month) and corporate balance sheet deleveraging, despite global geopolitical noise.",
    keyFindings: [
      "Domestic institutional investors provide structural liquidity floor for NIFTY 50.",
      "Private capex cycle showing early green shoots in energy transition and logistics.",
      "Valuations are near long-term averages at 21.2x 1-year forward P/E."
    ],
    marketInfo: {
      symbol: "NIFTY 50",
      price: "24,834.50",
      change: "+112.30 (+0.45%)"
    },
    riskFactors: [
      {
        factor: "Global Trade Slowdown",
        impact: "Medium",
        description: "Export-oriented sectors like chemicals and textiles face muted volume growth."
      }
    ],
    investmentInsights: [
      "Focus on domestic consumption, banking, and infrastructure leaders."
    ],
    agentContributions: [
      {
        agent: "Macro Economy Agent",
        role: "Macro risk modeling",
        insight: "India GDP growth projected at 6.8% for FY27; fastest growing major economy.",
        confidence: 92
      }
    ],
    suggestedActions: [
      "Continue systematic monthly equity investments without trying to time the market."
    ]
  },
  {
    id: "credit-analysis",
    title: "Credit Analysis",
    query: "Evaluate corporate borrower solvency and debt-service coverage ratio",
    type: "Credit",
    agentsUsed: ["Credit", "Risk"],
    date: "1 week ago",
    timestamp: "2026-09-18T11:00:00Z",
    status: "Completed",
    summary: "Borrower debt-service coverage ratio (DSCR) is robust at 2.45x with Altman Z-score in the safe zone (3.82), indicating negligible default probability.",
    keyFindings: [
      "Interest coverage ratio increased to 5.8x following debt paydown.",
      "Working capital cycle normalized to 48 days.",
      "Credit rating upgraded to AA+ with positive outlook by CRISIL."
    ],
    riskFactors: [
      {
        factor: "Raw Material Price Spikes",
        impact: "Low",
        description: "Operating margins have 350bps buffer before debt service is impaired."
      }
    ],
    investmentInsights: [
      "Credit spreads on corporate debentures offer 65bps spread over sovereign benchmark."
    ],
    agentContributions: [
      {
        agent: "Credit Agent",
        role: "Solvency and cash flow stress testing",
        insight: "Altman Z-Score of 3.82 indicates rock-solid balance sheet resilience.",
        confidence: 95
      }
    ],
    suggestedActions: [
      "Approve credit exposure limit up to ₹50 Cr."
    ]
  },
  {
    id: "fraud-analysis",
    title: "Fraud Analysis",
    query: "Scan high-frequency order book logs for spoofing and wash trading anomalies",
    type: "Fraud",
    agentsUsed: ["Fraud", "Trading"],
    date: "1 week ago",
    timestamp: "2026-09-17T16:20:00Z",
    status: "Completed",
    summary: "Graph anomaly detection scanned 1.2M order events; zero circular trading patterns or spoofing anomalies detected across desk executions.",
    keyFindings: [
      "Order cancellation ratio is normal at 4.2% within regulatory thresholds.",
      "No matching buy/sell orders between interrelated client accounts.",
      "Algorithmic execution footprints adhere 100% to SEBI best execution guidelines."
    ],
    riskFactors: [
      {
        factor: "Off-Exchange Latency Arbitrage",
        impact: "Low",
        description: "Monitored cross-exchange timestamp variance is below 0.4 milliseconds."
      }
    ],
    investmentInsights: [
      "All execution fills are benchmarked to true arrival price with negative slippage."
    ],
    agentContributions: [
      {
        agent: "Fraud Agent",
        role: "Graph Anomaly Detection & circular volume audit",
        insight: "Execution graph verified clean; zero anomalies flagged.",
        confidence: 99
      }
    ],
    suggestedActions: [
      "Maintain active surveillance rules for Q3 audit compliance."
    ]
  }
];

export function getAnalysisRecordById(id: string): AnalysisHistoryRecord | undefined {
  return MOCK_ANALYSIS_RECORDS.find((r) => r.id === id);
}

