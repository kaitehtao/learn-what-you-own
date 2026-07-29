export type Sp500Company = {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  weight: number;
};

export const sp500AsOf = "July 27, 2026";
export const sp500SourceUrl = "https://www.ishares.com/us/products/239726/ishares-core-s-p-500-etf/latest-holdings.csv";
export const sp500Companies: Sp500Company[] = [
  {
    "ticker": "AAPL",
    "name": "APPLE INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 7.75
  },
  {
    "ticker": "NVDA",
    "name": "NVIDIA CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 7.45
  },
  {
    "ticker": "MSFT",
    "name": "MICROSOFT CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 4.53
  },
  {
    "ticker": "AMZN",
    "name": "AMAZON.COM INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 3.55
  },
  {
    "ticker": "GOOGL",
    "name": "ALPHABET INC CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 3
  },
  {
    "ticker": "AVGO",
    "name": "BROADCOM INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 2.84
  },
  {
    "ticker": "GOOG",
    "name": "ALPHABET INC CLASS C",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 2.42
  },
  {
    "ticker": "META",
    "name": "META PLATFORMS INC CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 2.04
  },
  {
    "ticker": "MU",
    "name": "MICRON TECHNOLOGY INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 1.59
  },
  {
    "ticker": "JPM",
    "name": "JPMORGAN CHASE & CO",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 1.49
  },
  {
    "ticker": "LLY",
    "name": "ELI LILLY",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 1.48
  },
  {
    "ticker": "BRK.B",
    "name": "BERKSHIRE HATHAWAY INC CLASS B",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 1.43
  },
  {
    "ticker": "TSLA",
    "name": "TESLA INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 1.36
  },
  {
    "ticker": "AMD",
    "name": "ADVANCED MICRO DEVICES INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 1.26
  },
  {
    "ticker": "XOM",
    "name": "EXXONMOBIL HOLDINGS CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 1
  },
  {
    "ticker": "JNJ",
    "name": "JOHNSON & JOHNSON",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 1
  },
  {
    "ticker": "V",
    "name": "VISA INC CLASS A",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.94
  },
  {
    "ticker": "WMT",
    "name": "WALMART INC",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.77
  },
  {
    "ticker": "ABBV",
    "name": "ABBVIE INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.71
  },
  {
    "ticker": "CSCO",
    "name": "CISCO SYSTEMS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.71
  },
  {
    "ticker": "MA",
    "name": "MASTERCARD INC CLASS A",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.7
  },
  {
    "ticker": "INTC",
    "name": "INTEL CORPORATION",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.68
  },
  {
    "ticker": "COST",
    "name": "COSTCO WHOLESALE CORP",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.66
  },
  {
    "ticker": "AMAT",
    "name": "APPLIED MATERIAL INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.64
  },
  {
    "ticker": "BAC",
    "name": "BANK OF AMERICA CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.64
  },
  {
    "ticker": "CAT",
    "name": "CATERPILLAR INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.63
  },
  {
    "ticker": "UNH",
    "name": "UNITEDHEALTH GROUP INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.59
  },
  {
    "ticker": "GE",
    "name": "GE AEROSPACE",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.59
  },
  {
    "ticker": "LRCX",
    "name": "LAM RESEARCH CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.57
  },
  {
    "ticker": "CVX",
    "name": "CHEVRON CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.56
  },
  {
    "ticker": "PG",
    "name": "PROCTER & GAMBLE",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.54
  },
  {
    "ticker": "HD",
    "name": "HOME DEPOT INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.52
  },
  {
    "ticker": "KO",
    "name": "COCA-COLA",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.51
  },
  {
    "ticker": "MRK",
    "name": "MERCK & CO INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.51
  },
  {
    "ticker": "GS",
    "name": "GOLDMAN SACHS GROUP INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.48
  },
  {
    "ticker": "PM",
    "name": "PHILIP MORRIS INTERNATIONAL INC",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.48
  },
  {
    "ticker": "PLTR",
    "name": "PALANTIR TECHNOLOGIES INC CLASS A",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.47
  },
  {
    "ticker": "NFLX",
    "name": "NETFLIX INC",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.46
  },
  {
    "ticker": "RTX",
    "name": "RTX CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.46
  },
  {
    "ticker": "GEV",
    "name": "GE VERNOVA INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.42
  },
  {
    "ticker": "WFC",
    "name": "WELLS FARGO",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.42
  },
  {
    "ticker": "KLAC",
    "name": "KLA CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.42
  },
  {
    "ticker": "PANW",
    "name": "PALO ALTO NETWORKS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.4
  },
  {
    "ticker": "MS",
    "name": "MORGAN STANLEY",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.4
  },
  {
    "ticker": "TXN",
    "name": "TEXAS INSTRUMENT INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.4
  },
  {
    "ticker": "LIN",
    "name": "LINDE PLC",
    "sector": "Materials",
    "exchange": "NASDAQ",
    "weight": 0.37
  },
  {
    "ticker": "C",
    "name": "CITIGROUP INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.36
  },
  {
    "ticker": "TMO",
    "name": "THERMO FISHER SCIENTIFIC INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.33
  },
  {
    "ticker": "ORCL",
    "name": "ORACLE CORP",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.32
  },
  {
    "ticker": "IBM",
    "name": "INTERNATIONAL BUSINESS MACHINES CO",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.32
  },
  {
    "ticker": "AMGN",
    "name": "AMGEN INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.32
  },
  {
    "ticker": "VZ",
    "name": "VERIZON COMMUNICATIONS INC",
    "sector": "Communication",
    "exchange": "NYSE",
    "weight": 0.31
  },
  {
    "ticker": "MCD",
    "name": "MCDONALDS CORP",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.3
  },
  {
    "ticker": "PEP",
    "name": "PEPSICO INC",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.3
  },
  {
    "ticker": "SNDK",
    "name": "SANDISK CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.3
  },
  {
    "ticker": "NEE",
    "name": "NEXTERA ENERGY INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.29
  },
  {
    "ticker": "APH",
    "name": "AMPHENOL CORP CLASS A",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.29
  },
  {
    "ticker": "CRWD",
    "name": "CROWDSTRIKE HOLDINGS INC CLASS A",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.29
  },
  {
    "ticker": "STX",
    "name": "SEAGATE TECHNOLOGY HOLDINGS PLC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.29
  },
  {
    "ticker": "ABT",
    "name": "ABBOTT LABORATORIES",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.29
  },
  {
    "ticker": "ADI",
    "name": "ANALOG DEVICES INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.28
  },
  {
    "ticker": "QCOM",
    "name": "QUALCOMM INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.28
  },
  {
    "ticker": "AXP",
    "name": "AMERICAN EXPRESS",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.28
  },
  {
    "ticker": "UNP",
    "name": "UNION PACIFIC CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.28
  },
  {
    "ticker": "ANET",
    "name": "ARISTA NETWORKS INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.28
  },
  {
    "ticker": "WELL",
    "name": "WELLTOWER INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.27
  },
  {
    "ticker": "TJX",
    "name": "TJX INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.27
  },
  {
    "ticker": "WDC",
    "name": "WESTERN DIGITAL CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.27
  },
  {
    "ticker": "SCHW",
    "name": "CHARLES SCHWAB CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.27
  },
  {
    "ticker": "T",
    "name": "AT&T INC",
    "sector": "Communication",
    "exchange": "NYSE",
    "weight": 0.27
  },
  {
    "ticker": "DIS",
    "name": "WALT DISNEY",
    "sector": "Communication",
    "exchange": "NYSE",
    "weight": 0.26
  },
  {
    "ticker": "BA",
    "name": "BOEING",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.26
  },
  {
    "ticker": "MRVL",
    "name": "MARVELL TECHNOLOGY INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.26
  },
  {
    "ticker": "GILD",
    "name": "GILEAD SCIENCES INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.25
  },
  {
    "ticker": "DE",
    "name": "DEERE",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.25
  },
  {
    "ticker": "ETN",
    "name": "EATON PLC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.24
  },
  {
    "ticker": "BLK",
    "name": "BLACKROCK INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.24
  },
  {
    "ticker": "BKNG",
    "name": "BOOKING HOLDINGS INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.23
  },
  {
    "ticker": "CRM",
    "name": "SALESFORCE INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.22
  },
  {
    "ticker": "COP",
    "name": "CONOCOPHILLIPS",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.22
  },
  {
    "ticker": "PFE",
    "name": "PFIZER INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.22
  },
  {
    "ticker": "UBER",
    "name": "UBER TECHNOLOGIES INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.22
  },
  {
    "ticker": "PLD",
    "name": "PROLOGIS REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.22
  },
  {
    "ticker": "CVS",
    "name": "CVS HEALTH CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.21
  },
  {
    "ticker": "SPGI",
    "name": "S&P GLOBAL INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.21
  },
  {
    "ticker": "CB",
    "name": "CHUBB",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.2
  },
  {
    "ticker": "COF",
    "name": "CAPITAL ONE FINANCIAL CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.2
  },
  {
    "ticker": "BMY",
    "name": "BRISTOL MYERS SQUIBB",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.2
  },
  {
    "ticker": "ISRG",
    "name": "INTUITIVE SURGICAL INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.2
  },
  {
    "ticker": "PGR",
    "name": "PROGRESSIVE CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.2
  },
  {
    "ticker": "PH",
    "name": "PARKER-HANNIFIN CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.19
  },
  {
    "ticker": "DHR",
    "name": "DANAHER CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.19
  },
  {
    "ticker": "DELL",
    "name": "DELL TECHNOLOGIES INC CLASS C",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.19
  },
  {
    "ticker": "MO",
    "name": "ALTRIA GROUP INC",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.19
  },
  {
    "ticker": "VRTX",
    "name": "VERTEX PHARMACEUTICALS INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.19
  },
  {
    "ticker": "LOW",
    "name": "LOWES COMPANIES INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.19
  },
  {
    "ticker": "SBUX",
    "name": "STARBUCKS CORP",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.18
  },
  {
    "ticker": "LMT",
    "name": "LOCKHEED MARTIN CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.18
  },
  {
    "ticker": "SYK",
    "name": "STRYKER CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.18
  },
  {
    "ticker": "HWM",
    "name": "HOWMET AEROSPACE INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.18
  },
  {
    "ticker": "GLW",
    "name": "CORNING INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.18
  },
  {
    "ticker": "APP",
    "name": "APPLOVIN CORP CLASS A",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.17
  },
  {
    "ticker": "VRT",
    "name": "VERTIV HOLDINGS CLASS A",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.17
  },
  {
    "ticker": "NOW",
    "name": "SERVICENOW INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.17
  },
  {
    "ticker": "SO",
    "name": "SOUTHERN",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.17
  },
  {
    "ticker": "BNY",
    "name": "BANK OF NEW YORK MELLON CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.17
  },
  {
    "ticker": "MDT",
    "name": "MEDTRONIC PLC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.17
  },
  {
    "ticker": "TT",
    "name": "TRANE TECHNOLOGIES PLC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.17
  },
  {
    "ticker": "EQIX",
    "name": "EQUINIX REIT INC",
    "sector": "Real Estate",
    "exchange": "NASDAQ",
    "weight": 0.16
  },
  {
    "ticker": "MCK",
    "name": "MCKESSON CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.16
  },
  {
    "ticker": "ADP",
    "name": "AUTOMATIC DATA PROCESSING INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.16
  },
  {
    "ticker": "DUK",
    "name": "DUKE ENERGY CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.16
  },
  {
    "ticker": "PNC",
    "name": "PNC FINANCIAL SERVICES GROUP INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.16
  },
  {
    "ticker": "NEM",
    "name": "NEWMONT",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.16
  },
  {
    "ticker": "GD",
    "name": "GENERAL DYNAMICS CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.15
  },
  {
    "ticker": "USB",
    "name": "US BANCORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.15
  },
  {
    "ticker": "BX",
    "name": "BLACKSTONE INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.15
  },
  {
    "ticker": "CSX",
    "name": "CSX CORP",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.15
  },
  {
    "ticker": "ADBE",
    "name": "ADOBE INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.15
  },
  {
    "ticker": "FTNT",
    "name": "FORTINET INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.15
  },
  {
    "ticker": "ACN",
    "name": "ACCENTURE PLC CLASS A",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.15
  },
  {
    "ticker": "CDNS",
    "name": "CADENCE DESIGN SYSTEMS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.15
  },
  {
    "ticker": "PWR",
    "name": "QUANTA SERVICES INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.15
  },
  {
    "ticker": "MMM",
    "name": "3M",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.15
  },
  {
    "ticker": "CME",
    "name": "CME GROUP INC CLASS A",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.14
  },
  {
    "ticker": "CMI",
    "name": "CUMMINS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "MPC",
    "name": "MARATHON PETROLEUM CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "VLO",
    "name": "VALERO ENERGY CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "FCX",
    "name": "FREEPORT MCMORAN INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "MRSH",
    "name": "MARSH INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "WM",
    "name": "WASTE MANAGEMENT INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "JCI",
    "name": "JOHNSON CONTROLS INTERNATIONAL PLC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "WMB",
    "name": "WILLIAMS INC",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.14
  },
  {
    "ticker": "CEG",
    "name": "CONSTELLATION ENERGY CORP",
    "sector": "Utilities",
    "exchange": "NASDAQ",
    "weight": 0.14
  },
  {
    "ticker": "UPS",
    "name": "UNITED PARCEL SERVICE INC CLASS B",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.13
  },
  {
    "ticker": "ICE",
    "name": "INTERCONTINENTAL EXCHANGE INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.13
  },
  {
    "ticker": "INTU",
    "name": "INTUIT INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.13
  },
  {
    "ticker": "MAR",
    "name": "MARRIOTT INTERNATIONAL INC CLASS A",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.13
  },
  {
    "ticker": "EMR",
    "name": "EMERSON ELECTRIC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.13
  },
  {
    "ticker": "PSX",
    "name": "PHILLIPS 66",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.13
  },
  {
    "ticker": "DDOG",
    "name": "DATADOG INC CLASS A",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.13
  },
  {
    "ticker": "TRV",
    "name": "TRAVELERS COMPANIES INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.13
  },
  {
    "ticker": "TMUS",
    "name": "T MOBILE US INC",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.13
  },
  {
    "ticker": "ELV",
    "name": "ELEVANCE HEALTH INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.13
  },
  {
    "ticker": "CMCSA",
    "name": "COMCAST CORP CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.13
  },
  {
    "ticker": "GM",
    "name": "GENERAL MOTORS",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "AON",
    "name": "AON PLC CLASS A",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "ROST",
    "name": "ROSS STORES INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.12
  },
  {
    "ticker": "HON",
    "name": "HONEYWELL INTERNATIONAL INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.12
  },
  {
    "ticker": "MDLZ",
    "name": "MONDELEZ INTERNATIONAL INC CLASS A",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.12
  },
  {
    "ticker": "AMT",
    "name": "AMERICAN TOWER REIT CORP",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "NSC",
    "name": "NORFOLK SOUTHERN CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "SLB",
    "name": "SLB NV",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "CI",
    "name": "CIGNA",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "RCL",
    "name": "ROYAL CARIBBEAN GROUP LTD",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "HOOD",
    "name": "ROBINHOOD MARKETS INC CLASS A",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.12
  },
  {
    "ticker": "HLT",
    "name": "HILTON WORLDWIDE HOLDINGS INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "SPG",
    "name": "SIMON PROPERTY GROUP REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "ORLY",
    "name": "OREILLY AUTOMOTIVE INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.12
  },
  {
    "ticker": "SHW",
    "name": "SHERWIN WILLIAMS",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "EOG",
    "name": "EOG RESOURCES INC",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "ITW",
    "name": "ILLINOIS TOOL INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "SNPS",
    "name": "SYNOPSYS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.12
  },
  {
    "ticker": "CL",
    "name": "COLGATE-PALMOLIVE",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.12
  },
  {
    "ticker": "NOC",
    "name": "NORTHROP GRUMMAN CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "MCO",
    "name": "MOODYS CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "AEP",
    "name": "AMERICAN ELECTRIC POWER INC",
    "sector": "Utilities",
    "exchange": "NASDAQ",
    "weight": 0.11
  },
  {
    "ticker": "TDG",
    "name": "TRANSDIGM GROUP INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "CTAS",
    "name": "CINTAS CORP",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.11
  },
  {
    "ticker": "URI",
    "name": "UNITED RENTALS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "MSI",
    "name": "MOTOROLA SOLUTIONS INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "KKR",
    "name": "KKR AND CO INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "PCAR",
    "name": "PACCAR INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.11
  },
  {
    "ticker": "DASH",
    "name": "DOORDASH INC CLASS A",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.11
  },
  {
    "ticker": "CRH",
    "name": "CRH PUBLIC LIMITED PLC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "ECL",
    "name": "ECOLAB INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "FDX",
    "name": "FEDEX CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "DLR",
    "name": "DIGITAL REALTY TRUST REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "MNST",
    "name": "MONSTER BEVERAGE CORP",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.11
  },
  {
    "ticker": "BSX",
    "name": "BOSTON SCIENTIFIC CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "NXPI",
    "name": "NXP SEMICONDUCTORS NV",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.11
  },
  {
    "ticker": "ALL",
    "name": "ALLSTATE CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.11
  },
  {
    "ticker": "HONA",
    "name": "HONEYWELL AEROSPACE INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.1
  },
  {
    "ticker": "REGN",
    "name": "REGENERON PHARMACEUTICALS INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.1
  },
  {
    "ticker": "MPWR",
    "name": "MONOLITHIC POWER SYSTEMS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.1
  },
  {
    "ticker": "APD",
    "name": "AIR PRODUCTS AND CHEMICALS INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "AJG",
    "name": "ARTHUR J GALLAGHER",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "TFC",
    "name": "TRUIST FINANCIAL CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "HPE",
    "name": "HEWLETT PACKARD ENTERPRISE",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "TGT",
    "name": "TARGET CORP",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "WBD",
    "name": "WARNER BROS. DISCOVERY INC SERIES",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.1
  },
  {
    "ticker": "KMI",
    "name": "KINDER MORGAN INC",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "D",
    "name": "DOMINION ENERGY INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "ABNB",
    "name": "AIRBNB INC CLASS A",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.1
  },
  {
    "ticker": "O",
    "name": "REALTY INCOME REIT CORP",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "FIX",
    "name": "COMFORT SYSTEMS USA INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "GWW",
    "name": "WW GRAINGER INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.1
  },
  {
    "ticker": "TEL",
    "name": "TE CONNECTIVITY PLC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "COR",
    "name": "CENCORA INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "HCA",
    "name": "HCA HEALTHCARE INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "BKR",
    "name": "BAKER HUGHES CLASS A",
    "sector": "Energy",
    "exchange": "NASDAQ",
    "weight": 0.09
  },
  {
    "ticker": "SRE",
    "name": "SEMPRA",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "CTVA",
    "name": "CORTEVA INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "AFL",
    "name": "AFLAC INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "TRGP",
    "name": "TARGA RESOURCES CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "F",
    "name": "FORD MOTOR CO",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "APO",
    "name": "APOLLO GLOBAL MANAGEMENT INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "DAL",
    "name": "DELTA AIR LINES INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "LHX",
    "name": "L3HARRIS TECHNOLOGIES INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "NUE",
    "name": "NUCOR CORP",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "OKE",
    "name": "ONEOK INC",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "AME",
    "name": "AMETEK INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "LITE",
    "name": "LUMENTUM HOLDINGS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.09
  },
  {
    "ticker": "FAST",
    "name": "FASTENAL",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.09
  },
  {
    "ticker": "PSA",
    "name": "PUBLIC STORAGE REIT",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.09
  },
  {
    "ticker": "CARR",
    "name": "CARRIER GLOBAL CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "KEYS",
    "name": "KEYSIGHT TECHNOLOGIES INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "CAH",
    "name": "CARDINAL HEALTH INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "CIEN",
    "name": "CIENA CORP",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "COHR",
    "name": "COHERENT CORP",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "TER",
    "name": "TERADYNE INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.08
  },
  {
    "ticker": "ETR",
    "name": "ENTERGY CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "ROK",
    "name": "ROCKWELL AUTOMATION INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "FITB",
    "name": "FIFTH THIRD BANCORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "MET",
    "name": "METLIFE INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "STT",
    "name": "STATE STREET CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "WAB",
    "name": "WESTINGHOUSE AIR BRAKE TECHNOLOGIE",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "AZO",
    "name": "AUTOZONE INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "NKE",
    "name": "NIKE INC CLASS B",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "XEL",
    "name": "XCEL ENERGY INC",
    "sector": "Utilities",
    "exchange": "NASDAQ",
    "weight": 0.08
  },
  {
    "ticker": "EBAY",
    "name": "EBAY INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.08
  },
  {
    "ticker": "VST",
    "name": "VISTRA CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "DVN",
    "name": "DEVON ENERGY CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "PYPL",
    "name": "PAYPAL HOLDINGS INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.08
  },
  {
    "ticker": "VTR",
    "name": "VENTAS REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "AMP",
    "name": "AMERIPRISE FINANCE INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.08
  },
  {
    "ticker": "EXC",
    "name": "EXELON CORP",
    "sector": "Utilities",
    "exchange": "NASDAQ",
    "weight": 0.08
  },
  {
    "ticker": "EW",
    "name": "EDWARDS LIFESCIENCES CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "ADSK",
    "name": "AUTODESK INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "EA",
    "name": "ELECTRONIC ARTS INC",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "CVNA",
    "name": "CARVANA CLASS A",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "HUM",
    "name": "HUMANA INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "IDXX",
    "name": "IDEXX LABORATORIES INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "BDX",
    "name": "BECTON DICKINSON",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "XYZ",
    "name": "BLOCK INC CLASS A",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "RSG",
    "name": "REPUBLIC SERVICES INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "FLEX",
    "name": "FLEX LTD",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "CMG",
    "name": "CHIPOTLE MEXICAN GRILL INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "TTWO",
    "name": "TAKE TWO INTERACTIVE SOFTWARE INC",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "AXON",
    "name": "AXON ENTERPRISE INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "PRU",
    "name": "PRUDENTIAL FINANCIAL INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "MCHP",
    "name": "MICROCHIP TECHNOLOGY INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "CBRE",
    "name": "CBRE GROUP INC CLASS A",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "NDAQ",
    "name": "NASDAQ INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.07
  },
  {
    "ticker": "AIG",
    "name": "AMERICAN INTERNATIONAL GROUP INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "MSCI",
    "name": "MSCI INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.07
  },
  {
    "ticker": "ODFL",
    "name": "OLD DOMINION FREIGHT LINE INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "IBKR",
    "name": "INTERACTIVE BROKERS GROUP INC CLAS",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "ED",
    "name": "CONSOLIDATED EDISON INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "KDP",
    "name": "KEURIG DR PEPPER INC",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "YUM",
    "name": "YUM BRANDS INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "SYY",
    "name": "SYSCO CORP",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "ADM",
    "name": "ARCHER DANIELS MIDLAND",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "OXY",
    "name": "OCCIDENTAL PETROLEUM CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "GRMN",
    "name": "GARMIN LTD",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "PEG",
    "name": "PUBLIC SERVICE ENTERPRISE GROUP IN",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "UAL",
    "name": "UNITED AIRLINES HOLDINGS INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "A",
    "name": "AGILENT TECHNOLOGIES INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "DHI",
    "name": "D R HORTON INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "PCG",
    "name": "PG&E CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "HIG",
    "name": "HARTFORD INSURANCE GROUP INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "FANG",
    "name": "DIAMONDBACK ENERGY INC",
    "sector": "Energy",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "ROP",
    "name": "ROPER TECHNOLOGIES INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "IRM",
    "name": "IRON MOUNTAIN INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "KVUE",
    "name": "KENVUE INC",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "COIN",
    "name": "COINBASE GLOBAL INC CLASS A",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "PAYX",
    "name": "PAYCHEX INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "WEC",
    "name": "WEC ENERGY GROUP INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "KMB",
    "name": "KIMBERLY CLARK CORP",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "VMC",
    "name": "VULCAN MATERIALS",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "WAT",
    "name": "WATERS CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "MTB",
    "name": "M&T BANK",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "ACGL",
    "name": "ARCH CAPITAL GROUP LTD",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.06
  },
  {
    "ticker": "IQV",
    "name": "IQVIA HOLDINGS INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.06
  },
  {
    "ticker": "ON",
    "name": "ON SEMICONDUCTOR CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "CCL",
    "name": "CARNIVAL CORP LTD",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "HBAN",
    "name": "HUNTINGTON BANCSHARES INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "MLM",
    "name": "MARTIN MARIETTA MATERIALS INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "STLD",
    "name": "STEEL DYNAMICS INC",
    "sector": "Materials",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "NTRS",
    "name": "NORTHERN TRUST CORP",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "NTAP",
    "name": "NETAPP INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "EME",
    "name": "EMCOR GROUP INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "KR",
    "name": "KROGER",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "JBL",
    "name": "JABIL INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "EQT",
    "name": "EQT CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "CCI",
    "name": "CROWN CASTLE INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "ZTS",
    "name": "ZOETIS INC CLASS A",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "EXPE",
    "name": "EXPEDIA GROUP INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "CASY",
    "name": "CASEYS GENERAL STORES INC",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "EXR",
    "name": "EXTRA SPACE STORAGE REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "AEE",
    "name": "AMEREN CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "DTE",
    "name": "DTE ENERGY",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "EIX",
    "name": "EDISON INTERNATIONAL",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "TDY",
    "name": "TELEDYNE TECHNOLOGIES INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "IR",
    "name": "INGERSOLL RAND INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "CBOE",
    "name": "CBOE GLOBAL MARKETS INC",
    "sector": "Financials",
    "exchange": "Cboe BZX",
    "weight": 0.05
  },
  {
    "ticker": "RJF",
    "name": "RAYMOND JAMES INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "CFG",
    "name": "CITIZENS FINANCIAL GROUP INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "WDAY",
    "name": "WORKDAY INC CLASS A",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "CNC",
    "name": "CENTENE CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "TPR",
    "name": "TAPESTRY INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "ATO",
    "name": "ATMOS ENERGY CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "FICO",
    "name": "FAIR ISAAC CORP",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "BIIB",
    "name": "BIOGEN INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.05
  },
  {
    "ticker": "RMD",
    "name": "RESMED INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "VICI",
    "name": "VICI PPTYS INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "VEEV",
    "name": "VEEVA SYSTEMS INC CLASS A",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "CNP",
    "name": "CENTERPOINT ENERGY INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "NRG",
    "name": "NRG ENERGY INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.05
  },
  {
    "ticker": "WTW",
    "name": "WILLIS TOWERS WATSON PLC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "XYL",
    "name": "XYLEM INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "CINF",
    "name": "CINCINNATI FINANCIAL CORP",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "LYV",
    "name": "LIVE NATION ENTERTAINMENT INC",
    "sector": "Communication",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "DXCM",
    "name": "DEXCOM INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "ES",
    "name": "EVERSOURCE ENERGY",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "OTIS",
    "name": "OTIS WORLDWIDE CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "FISV",
    "name": "FISERV INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "Q",
    "name": "QNITY ELECTRONICS INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "GEHC",
    "name": "GE HEALTHCARE TECHNOLOGIES INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "DOV",
    "name": "DOVER CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "WSM",
    "name": "WILLIAMS SONOMA INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "DG",
    "name": "DOLLAR GENERAL CORP",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "PPL",
    "name": "PPL CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "VRSK",
    "name": "VERISK ANALYTICS INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "MTD",
    "name": "METTLER TOLEDO INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "ARES",
    "name": "ARES MANAGEMENT CORP CLASS A",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "HAL",
    "name": "HALLIBURTON",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "HSY",
    "name": "HERSHEY FOODS",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "PPG",
    "name": "PPG INDUSTRIES INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "CPRT",
    "name": "COPART INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "HUBB",
    "name": "HUBBELL INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "AWK",
    "name": "AMERICAN WATER WORKS INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "SW",
    "name": "SMURFIT WESTROCK PLC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "RF",
    "name": "REGIONS FINANCIAL CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "AVB",
    "name": "AVALONBAY COMMUNITIES REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "FE",
    "name": "FIRSTENERGY CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "DGX",
    "name": "QUEST DIAGNOSTICS INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "TROW",
    "name": "T ROWE PRICE GROUP INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "SYF",
    "name": "SYNCHRONY FINANCIAL",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "PHM",
    "name": "PULTEGROUP INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "CPAY",
    "name": "CORPAY INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "LH",
    "name": "LABCORP HOLDINGS INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "HPQ",
    "name": "HP INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "OMC",
    "name": "OMNICOM GROUP INC",
    "sector": "Communication",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "WST",
    "name": "WEST PHARMACEUTICAL SERVICES INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "CHD",
    "name": "CHURCH AND DWIGHT INC",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "DRI",
    "name": "DARDEN RESTAURANTS INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "VLTO",
    "name": "VERALTO CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "FFIV",
    "name": "F5 INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "TPL",
    "name": "TEXAS PACIFIC LAND CORP",
    "sector": "Energy",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "CMS",
    "name": "CMS ENERGY CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "EQR",
    "name": "EQUITY RESIDENTIAL REIT",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "DLTR",
    "name": "DOLLAR TREE INC",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "VRSN",
    "name": "VERISIGN INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "IP",
    "name": "INTERNATIONAL PAPER",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "EXPD",
    "name": "EXPEDITORS INTERNATIONAL OF WASHIN",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.04
  },
  {
    "ticker": "KHC",
    "name": "KRAFT HEINZ",
    "sector": "Consumer Staples",
    "exchange": "NASDAQ",
    "weight": 0.04
  },
  {
    "ticker": "PKG",
    "name": "PACKAGING CORP OF AMERICA",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "FIS",
    "name": "FIDELITY NATIONAL INFORMATION SERV",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "CTSH",
    "name": "COGNIZANT TECHNOLOGY SOLUTIONS COR",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "WRB",
    "name": "WR BERKLEY CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "LUV",
    "name": "SOUTHWEST AIRLINES",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "FSLR",
    "name": "FIRST SOLAR INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "NI",
    "name": "NISOURCE INC",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "PFG",
    "name": "PRINCIPAL FINANCIAL GROUP INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "EXE",
    "name": "EXPAND ENERGY CORP",
    "sector": "Energy",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "STE",
    "name": "STERIS",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "EFX",
    "name": "EQUIFAX INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "SNA",
    "name": "SNAP ON INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "JBHT",
    "name": "JB HUNT TRANSPORT SERVICES INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "AMCR",
    "name": "AMCOR PLC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "ULTA",
    "name": "ULTA BEAUTY INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "KEY",
    "name": "KEYCORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "DOW",
    "name": "DOW INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "EL",
    "name": "ESTEE LAUDER INC CLASS A",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "CHRW",
    "name": "CH ROBINSON WORLDWIDE INC",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "VTRS",
    "name": "VIATRIS INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "BRO",
    "name": "BROWN & BROWN INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "L",
    "name": "LOEWS CORP",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "INCY",
    "name": "INCYTE CORP",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "EVRG",
    "name": "EVERGY INC",
    "sector": "Utilities",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "MRNA",
    "name": "MODERNA INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "GPN",
    "name": "GLOBAL PAYMENTS INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "GIS",
    "name": "GENERAL MILLS INC",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "IFF",
    "name": "INTERNATIONAL FLAVORS & FRAGRANCES",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "FTV",
    "name": "FORTIVE CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "DD",
    "name": "DUPONT DE NEMOURS INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "LNT",
    "name": "ALLIANT ENERGY CORP",
    "sector": "Utilities",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "ESS",
    "name": "ESSEX PROPERTY TRUST REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "CF",
    "name": "CF INDUSTRIES HOLDINGS INC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "SBAC",
    "name": "SBA COMMUNICATIONS REIT CORP CLASS",
    "sector": "Real Estate",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "LEN",
    "name": "LENNAR A CORP CLASS A",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "STZ",
    "name": "CONSTELLATION BRANDS INC CLASS A",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "ZBH",
    "name": "ZIMMER BIOMET HOLDINGS INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "KIM",
    "name": "KIMCO REALTY REIT CORP",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "BR",
    "name": "BROADRIDGE FINANCIAL SOLUTIONS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "CDW",
    "name": "CDW CORP",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "GPC",
    "name": "GENUINE PARTS",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "LII",
    "name": "LENNOX INTERNATIONAL INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "BBY",
    "name": "BEST BUY INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "WY",
    "name": "WEYERHAEUSER REIT",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "NVR",
    "name": "NVR INC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "BALL",
    "name": "BALL CORP",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "TSN",
    "name": "TYSON FOODS INC CLASS A",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "SMCI",
    "name": "SUPER MICRO COMPUTER INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "TXT",
    "name": "TEXTRON INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "TSCO",
    "name": "TRACTOR SUPPLY",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "IEX",
    "name": "IDEX CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "AKAM",
    "name": "AKAMAI TECHNOLOGIES INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.03
  },
  {
    "ticker": "MAS",
    "name": "MASCO CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "FDXF",
    "name": "FEDEX FREIGHT HOLDING COMPANY INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "INVH",
    "name": "INVITATION HOMES INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.03
  },
  {
    "ticker": "BG",
    "name": "BUNGE GLOBAL SA",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "J",
    "name": "JACOBS SOLUTIONS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "HST",
    "name": "HOST HOTELS & RESORTS REIT INC",
    "sector": "Real Estate",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "NDSN",
    "name": "NORDSON CORP",
    "sector": "Industrials",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "MAA",
    "name": "MID AMERICA APARTMENT COMMUNITIES",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "DOC",
    "name": "HEALTHPEAK PROPERTIES INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "EG",
    "name": "EVEREST GROUP LTD",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "LYB",
    "name": "LYONDELLBASELL INDUSTRIES CLASS A",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "GEN",
    "name": "GEN DIGITAL INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "RL",
    "name": "RALPH LAUREN CORP CLASS A",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "SWK",
    "name": "STANLEY BLACK & DECKER INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "PTC",
    "name": "PTC INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "LDOS",
    "name": "LEIDOS HOLDINGS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "LVS",
    "name": "LAS VEGAS SANDS CORP",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "DECK",
    "name": "DECKERS OUTDOOR CORP",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "AIZ",
    "name": "ASSURANT INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "COO",
    "name": "COOPER INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "ALB",
    "name": "ALBEMARLE CORP",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "REG",
    "name": "REGENCY CENTERS REIT CORP",
    "sector": "Real Estate",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "ALLE",
    "name": "ALLEGION PLC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "GL",
    "name": "GLOBE LIFE INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "IVZ",
    "name": "INVESCO LTD",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "TYL",
    "name": "TYLER TECHNOLOGIES INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "TRMB",
    "name": "TRIMBLE INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "SJM",
    "name": "JM SMUCKER",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "MKC",
    "name": "MCCORMICK & CO NON-VOTING INC",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "GDDY",
    "name": "GODADDY INC CLASS A",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "PNW",
    "name": "PINNACLE WEST CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "ZBRA",
    "name": "ZEBRA TECHNOLOGIES CORP CLASS A",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "AVY",
    "name": "AVERY DENNISON CORP",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "LULU",
    "name": "LULULEMON ATHLETICA INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "APA",
    "name": "APA CORP",
    "sector": "Energy",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "APTV",
    "name": "APTIV PLC",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "HAS",
    "name": "HASBRO INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "RVTY",
    "name": "REVVITY INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "BAX",
    "name": "BAXTER INTERNATIONAL INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "CSGP",
    "name": "COSTAR GROUP INC",
    "sector": "Real Estate",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "SOLV",
    "name": "SOLVENTUM CORP",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "CLX",
    "name": "CLOROX",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "ECHO",
    "name": "ECHOSTAR CORP CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "GNRC",
    "name": "GENERAC HOLDINGS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "UDR",
    "name": "UDR REIT INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "TKO",
    "name": "TKO GROUP HOLDINGS INC CLASS A",
    "sector": "Communication",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "ROL",
    "name": "ROLLINS INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "PODD",
    "name": "INSULET CORP",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "HII",
    "name": "HUNTINGTON INGALLS INDUSTRIES INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "CPT",
    "name": "CAMDEN PROPERTY TRUST REIT",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "FOXA",
    "name": "FOX CORP CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "TECH",
    "name": "BIO TECHNE CORP",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "ALGN",
    "name": "ALIGN TECHNOLOGY INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "CHTR",
    "name": "CHARTER COMMUNICATIONS INC CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "JKHY",
    "name": "JACK HENRY AND ASSOCIATES INC",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "CRL",
    "name": "CHARLES RIVER LABORATORIES INTERNA",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "AES",
    "name": "AES CORP",
    "sector": "Utilities",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "DPZ",
    "name": "DOMINOS PIZZA INC",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "BXP",
    "name": "BXP INC",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "PNR",
    "name": "PENTAIR",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "BEN",
    "name": "FRANKLIN RESOURCES INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "FRT",
    "name": "FEDERAL REALTY INVESTMENT TRUST RE",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "NWSA",
    "name": "NEWS CORP CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.02
  },
  {
    "ticker": "IT",
    "name": "GARTNER INC",
    "sector": "Information Technology",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "FDS",
    "name": "FACTSET RESEARCH SYSTEMS INC",
    "sector": "Financials",
    "exchange": "NYSE",
    "weight": 0.02
  },
  {
    "ticker": "SWKS",
    "name": "SKYWORKS SOLUTIONS INC",
    "sector": "Information Technology",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "NCLH",
    "name": "NORWEGIAN CRUISE LINE HOLDINGS LTD",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "MGM",
    "name": "MGM RESORTS INTERNATIONAL",
    "sector": "Consumer Discretionary",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "UHS",
    "name": "UNIVERSAL HEALTH SERVICES INC CLAS",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "WYNN",
    "name": "WYNN RESORTS LTD",
    "sector": "Consumer Discretionary",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "HSIC",
    "name": "HENRY SCHEIN INC",
    "sector": "Health Care",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "ARE",
    "name": "ALEXANDRIA REAL ESTATE EQUITIES RE",
    "sector": "Real Estate",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "BLDR",
    "name": "BUILDERS FIRSTSOURCE INC",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "TTD",
    "name": "TRADE DESK INC CLASS A",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "HRL",
    "name": "HORMEL FOODS CORP",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "DVA",
    "name": "DAVITA INC",
    "sector": "Health Care",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "MOS",
    "name": "MOSAIC",
    "sector": "Materials",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "FOX",
    "name": "FOX CORP CLASS B",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "AOS",
    "name": "A O SMITH CORP",
    "sector": "Industrials",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "TAP",
    "name": "MOLSON COORS BREWING CLASS B",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "ERIE",
    "name": "ERIE INDEMNITY CLASS A",
    "sector": "Financials",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "BF.B",
    "name": "BROWN FORMAN CORP CLASS B",
    "sector": "Consumer Staples",
    "exchange": "NYSE",
    "weight": 0.01
  },
  {
    "ticker": "NWS",
    "name": "NEWS CORP CLASS B",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0.01
  },
  {
    "ticker": "PSKY",
    "name": "PARAMOUNT SKYDANCE CORP CLASS B",
    "sector": "Communication",
    "exchange": "NASDAQ",
    "weight": 0
  }
];

export function companySlug(ticker: string) {
  return ticker.toLowerCase().replaceAll(".", "-");
}

export function tickerFromSlug(slug: string) {
  const upper = slug.toUpperCase();
  if (upper === "BRK-B") return "BRK.B";
  if (upper === "BF-B") return "BF.B";
  return upper;
}
