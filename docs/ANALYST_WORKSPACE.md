# Public research and private analyst workflow

Learn What You Own now separates evidence that benefits the research community from judgment that belongs to an individual member.

## Public by default

Public dossiers may contain source-linked facts, SEC filing history, official company releases, external journalism, earnings history, ownership data, comparable-company metrics, historical valuation multiples, public interviews, and research that has passed moderation. Public pages must show methodology, source links, freshness, and material limitations.

Public facts are not personalized recommendations. Valuation percentiles describe where a current multiple sits in its own recorded history; they do not by themselves establish intrinsic value.

## Private by default

The analyst workspace stores the member's consensus view, variant view, current conclusion, conviction, workflow status, measurable bull and bear drivers, falsification tests, scenario probabilities, price targets, assumptions, decision journal, notebook notes, source links, and private attachments. It also implements the FACTS method: Financial, Accounting, Credibility, Timing, and Sector.

The private FACTS worksheet adds:

- an evidence status, score, conclusion, decisive question, and evidence gap for each FACTS dimension;
- growth, value, and turnaround classification;
- target return, target date, maximum position size, liquidity plan, and explicit entry, hold, and exit rules;
- a dated management-commitment ledger that compares public promises with outcomes;
- a private management and third-party-check log for customer, supplier, distributor, competitor, consultant, and trade-show findings; and
- decision postmortems that distinguish process quality from investment outcome.

Private workspace records:

- require an authenticated member;
- are protected by Supabase row-level security keyed to `auth.uid()`;
- are excluded from crawler access;
- use private, no-store responses;
- appear in the member's account export;
- never move to a public dossier automatically.

## Optional publication workflow

When a member wants to share a conclusion, they create a separate contribution or research publication. That action copies only the material the member deliberately enters into the submission. The submission remains non-public until editorial moderation approves it. The private workspace remains private even after a related contribution is published.

The workflow is:

1. Read the public dossier and primary evidence.
2. Capture sources and excerpts in the private notebook.
3. State the market consensus and a falsifiable variant view.
4. Rank bull, bear, and neutral drivers using evidence, confidence, importance, and EPIC tests.
5. Build bull/base/bear scenarios whose probabilities total 100%.
6. Record the decision, observed price, key risk, and next catalyst.
7. Complete the Financial, Accounting, Credibility, Timing, and Sector assessments and list unresolved evidence gaps.
8. Define entry, hold, reduce, and exit conditions before capital is committed.
9. Review management promises, channel checks, and the journal after earnings and material filings.
10. Complete a postmortem after a major thesis decision or closed position.
11. Optionally submit a separate public contribution for moderation.

## Public and private FACTS boundary

The public dossier shows the source-linked evidence map for each FACTS dimension and sends members to the relevant filings, ownership, valuation, earnings, comparable-company, interview, and relationship sections. It never shows a member's score, conviction, target return, position limit, channel-check notes, decision rules, or postmortem. Those records remain private under Supabase RLS unless the member separately submits selected material through the moderated public-contribution workflow.

## Historical valuation methodology

The public valuation panel combines month-end market closes with only the SEC facts whose filing date was on or before that market date. It calculates P/E, EV/revenue, EV/EBITDA, price/free-cash-flow, and free-cash-flow yield where the necessary positive denominators and capital-structure facts are available. It publishes the current observation, historical mean, median, range, percentile, and premium or discount to median across one-, three-, and five-year windows.

The calculation deliberately returns unavailable values rather than inventing missing debt, cash, earnings, or cash-flow facts. Analysts should normalize leases, pensions, minority interests, cyclicality, stock compensation, acquisitions, and one-time items in their private work before making a decision.
