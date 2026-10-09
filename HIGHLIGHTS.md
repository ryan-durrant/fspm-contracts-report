# Weekly highlight rings

Craig edits one file each week. The site draws a hand-drawn ring around the numbers in that file. Numbers only. Do not put names or notes in the file.

Create `highlights/YYYY-MM-DD.json`. The date is the report date, for example `highlights/2026-10-05.json`. The file is a list of rings. If the file is missing, that week has no rings. A bad entry is printed while the site builds and then skipped. It does not stop the build.

## Fields

Each ring needs a `color`: `red`, `yellow`, or `green`. `label` is optional and short.

| What you want circled | Keys |
| --- | --- |
| Green unapproved count on a property card | `"page": "w27"`, `"property": "<id>"`, `"field": "unapproved"` |
| Blue inactive count on a property card | `"page": "w27"`, `"property": "<id>"`, `"field": "inactive"` |
| Filled/total on a property card | `"field": "filled"` on `w27`, `s27`, or `community` |
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

The 10/5 file rings the unapproved counts for Carriage House, Haven Blue, and Avonlea Men.
