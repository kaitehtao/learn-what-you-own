import { env } from "cloudflare:workers";

export const brokerages = [
  {
    key: "etrade",
    name: "E*TRADE from Morgan Stanley",
    mark: "E*TRADE",
    className: "etrade",
    host: "us.etrade.com",
    loginUrl: "https://us.etrade.com/e/t/user/login",
    openUrl: "https://us.etrade.com/what-we-offer/our-accounts/brokerage-account",
    referralEnvironmentKey: "BROKERAGE_REFERRAL_ETRADE",
  },
  {
    key: "fidelity",
    name: "Fidelity Investments",
    mark: "FIDELITY",
    className: "fidelity",
    host: "fidelity.com",
    loginUrl: "https://digital.fidelity.com/prgw/digital/login/full-page",
    openUrl: "https://www.fidelity.com/open-account/overview/",
    referralEnvironmentKey: "BROKERAGE_REFERRAL_FIDELITY",
  },
  {
    key: "schwab",
    name: "Charles Schwab",
    mark: "SCHWAB",
    className: "schwab",
    host: "schwab.com",
    loginUrl: "https://client.schwab.com/Login/SignOn/CustomerCenterLogin.aspx",
    openUrl: "https://www.schwab.com/brokerage",
    referralEnvironmentKey: "BROKERAGE_REFERRAL_SCHWAB",
  },
  {
    key: "morgan-stanley",
    name: "Morgan Stanley",
    mark: "MORGAN STANLEY",
    className: "morgan-stanley",
    host: "morganstanley.com",
    loginUrl: "https://www.morganstanley.com/online",
    openUrl: "https://www.morganstanley.com/what-we-do/wealth-management",
    referralEnvironmentKey: "BROKERAGE_REFERRAL_MORGAN_STANLEY",
  },
  {
    key: "jpmorgan",
    name: "J.P. Morgan",
    mark: "J.P. MORGAN",
    className: "jpmorgan",
    host: "chase.com",
    loginUrl: "https://secure.chase.com/web/auth/dashboard#/dashboard/overviewAccounts/overview/index",
    openUrl: "https://www.chase.com/personal/investments/brokerage-account",
    referralEnvironmentKey: "BROKERAGE_REFERRAL_JPMORGAN",
  },
  {
    key: "interactive-brokers",
    name: "Interactive Brokers",
    mark: "IBKR",
    className: "interactive-brokers",
    host: "interactivebrokers.com",
    loginUrl: "https://www.interactivebrokers.com/sso/Login?RL=1",
    openUrl: "https://www.interactivebrokers.com/en/accounts/open_account.php",
    referralEnvironmentKey: "BROKERAGE_REFERRAL_INTERACTIVE_BROKERS",
  },
] as const;

export type BrokerageKey = typeof brokerages[number]["key"];
export type BrokerageAction = "login" | "open";

function runtimeValue(name: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  if (typeof workerValue === "string" && workerValue.trim()) return workerValue.trim();
  return process.env[name]?.trim() ?? "";
}

function secureUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function brokerageByKey(key: string) {
  return brokerages.find((brokerage) => brokerage.key === key);
}

export function referralUrlFor(key: BrokerageKey) {
  const brokerage = brokerageByKey(key);
  if (!brokerage) return "";
  return secureUrl(runtimeValue(brokerage.referralEnvironmentKey));
}

export function brokerageDestination(key: BrokerageKey, action: BrokerageAction) {
  const brokerage = brokerageByKey(key);
  if (!brokerage) return null;
  const referralUrl = action === "open" ? referralUrlFor(key) : "";
  return {
    url: referralUrl || (action === "open" ? brokerage.openUrl : brokerage.loginUrl),
    destinationType: referralUrl ? "paid_referral" as const : "official" as const,
  };
}
