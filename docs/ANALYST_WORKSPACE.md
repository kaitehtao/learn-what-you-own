# Public research and private analyst workflow

Learn What You Own now separates evidence that benefits the research community from judgment that belongs to an individual member.

## Public by default

Public dossiers may contain source-linked facts, SEC filing history, official company releases, external journalism, earnings history, ownership data, comparable-company metrics, historical valuation multiples, public interviews, and research that has passed moderation. Public pages must show methodology, source links, freshness, and material limitations.

Public facts are not personalized recommendations. Valuation percentiles describe where a current multiple sits in its own recorded history; they do not by themselves establish intrinsic value.

## Private by default

The analyst workspace stores the member's consensus view, variant view, current conclusion, conviction, workflow status, measurable bull and bear drivers, falsification tests, scenario probabilities, price targets, assumptions, decision journal, notebook notes, source links, and private attachments.

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
7. Review the journal after earnings and material filings.
8. Optionally submit a separate public contribution for moderation.

## Historical valuation methodology

The public valuation panel combines month-end market closes with only the SEC facts whose filing date was on or before that market date. It calculates P/E, EV/revenue, EV/EBITDA, price/free-cash-flow, and free-cash-flow yield where the necessary positive denominators and capital-structure facts are available. It publishes the current observation, historical mean, median, range, percentile, and premium or discount to median across one-, three-, and five-year windows.

The calculation deliberately returns unavailable values rather than inventing missing debt, cash, earnings, or cash-flow facts. Analysts should normalize leases, pensions, minority interests, cyclicality, stock compensation, acquisitions, and one-time items in their private work before making a decision.
