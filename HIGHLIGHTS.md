# Weekly highlight rings

Craig edits one file each week. The site draws a hand-drawn ring around the numbers in that file. Numbers only. Do not put resident names or notes in the file. A date badge such as `Dec 1 Start` belongs on the community property in `data/community-housing.json` (`note`), not in this file.

Create `highlights/YYYY-MM-DD.json`. The date is the report date, for example `highlights/2026-10-12.json`. If the file is missing, that week has no rings. A bad entry is printed while the site builds and then skipped. It does not stop the build.

## Standing rules

`config/highlight-rules.json` holds the automatic rings. They run for a week only when that week's file is an object with `"rules": true`. A bare JSON array is manual rings only, so an older week such as 10/5 keeps exactly the rings that were saved.

| Rule | Default | What gets a ring |
| --- | --- | --- |
| `unapprovedAtLeast` | 10 | Red ring on a Winter unapproved count at or above the threshold |
| `inactiveAtLeast` | 10 | Red ring on a Winter inactive count at or above the threshold |
| `fullColor` | green | Green ring on filled/total when filled is at least capacity |
| `fullPages` | `w27`, `s27`, `comparison` | Pages that get the full-property ring |

Change the numbers in `config/highlight-rules.json` to move the thresholds. Manual rings in the week file are drawn in addition to the standing rules.

The 10/12 file turns the rules on. Haven Blue's inactive 14 is the only automatic red ring. Carriage House, Carriage House Townhouse, Avonlea House, Haven 149, and Haven 175 are full, so they get green rings on Winter and on the comparison page. The same file adds Ryan's community rings: red on Liberty Corner, LC II, and LC Duplex, and yellow on #122 Classic and Haven Green Townhouse.

## Fields

Each ring needs a `color`: `red`, `yellow`, or `green`. `label` is optional and short.

| What you want circled | Keys |
| --- | --- |
| Green unapproved count on a property card | `"page": "w27"`, `"property": "<id>"`, `"field": "unapproved"` |
| Blue inactive count on a property card | `"page": "w27"`, `"property": "<id>"`, `"field": "inactive"` |
| Filled/total on a property card | `"field": "filled"` on `w27`, `s27`, `community`, or `comparison` |
| Percent on a property card | `"field": "percent"` on `w27`, `s27`, `community`, or `comparison` |
| Page total (Total Contracts callout) | `"page": "w27"` or `"s27"`, `"field": "total"` |
| A callout (market %, BNH, women, men) | `"field": "callout"`, `"callout": "market"` (also `bnh`, `women`, `men`, `total`, `last-bnh`, `last-market`) |
| Community office total | `"page": "community"`, `"office": "avonlea-office"` or `"haven-office"`, `"field": "total"` |
| Every card that shows a field | `"applyToAll": true` and `"field"` (`unapproved`, `inactive`, `filled`, or `percent`). Add `"page"` to limit it to one page. |

`w27` is the current-semester contracts page. `s27` is the next semester. Other pages: `highlights`, `comparison`, `goals`, `community`.

Property ids: `carriage-house`, `carriage-townhouse`, `avonlea-house`, `avonlea-women`, `avonlea-men`, `haven-blue`, `haven-white`, `haven-green`, `haven-red`, `haven-179`, `haven-175`, `haven-163`, `haven-149`, `haven-129`.

Community ids: `liberty-corner`, `lc-ii`, `lc-house`, `lc-duplex`, `t-house`, `bell-house`, `birch-house`, `east-triplex`, `north-triplex`, `classic-122`, `piano-casa`, `rock-casa`, `haven-green-townhouse`, `the-nest`.

## Examples

Red ring on one unapproved count:

```json
{"page":"w27","property":"haven-blue","field":"unapproved","color":"red","label":"work these"}
```

Yellow rings on every inactive count:

```json
{"field":"inactive","applyToAll":true,"color":"yellow"}
```

Green ring on a community office total:

```json
{"page":"community","office":"haven-office","field":"total","color":"green"}
```

A week file that opts into the standing rules looks like this. `rings` is the manual list:

```json
{
  "rules": true,
  "rings": [
    {"page":"community","property":"liberty-corner","field":"filled","color":"red"}
  ]
}
```

The 10/5 file is a bare array. It rings the unapproved counts for Carriage House, Haven Blue, and Avonlea Men, and the standing rules stay off for that snapshot.
