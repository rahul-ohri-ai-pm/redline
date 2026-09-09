# 10. Opportunity flags are advisory and exempt from the citation invariant

## Decision

Opportunity flags ([[0006-opportunity-flags-and-disclaimer]]) are not held
to the verbatim-citation requirement in
[[0001-every-flag-cites-its-source]]. They're framed as general
suggestions ("many renters negotiate this," "you could ask for X") rather
than findings backed by a specific source sentence or data point, because
by definition they're about something absent from the document — there's
nothing in the text to cite.

## Alternatives

- Require opportunity flags to cite the state-standard data point that
  motivates them (e.g. "security deposits in [state] average $X, yours is
  $Y"). Rejected by the user: opportunity flags are recommendations, not
  claims Redline is asserting as fact — "we are not advising them to do
  things they should definitely do, as we are not lawyers." A hard-data
  citation would make an opportunity flag read as a finding, overstating
  what it is.

## Why

Risk flags warn about something in the document and need to be falsifiable
because the renter is being told to worry about something real
(citation makes that checkable). Opportunity flags suggest something that
isn't there — holding them to the same evidentiary bar as a risk flag would
misrepresent a suggestion as a finding, undermining the disclaimer's point
([[0006-opportunity-flags-and-disclaimer]]) rather than reinforcing it.

## Consequences

- The report UI must visually distinguish opportunity flags from risk
  flags clearly enough that a renter never mistakes "you could negotiate
  for X" for "this document says X" — conflating the two would violate the
  spirit of [[0001-every-flag-cites-its-source]] even though opportunity
  flags are formally exempt from it.
- Because opportunity flags carry no hard citation, they inherit more
  reputational risk than risk flags do if they're wrong or generic —
  worth keeping deliberately general/low-commitment in copy, per the
  user's framing, rather than trying to make them sound authoritative.
