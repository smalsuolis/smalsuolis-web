# Figma MVP → design tokens (measured, not estimated)

Source: Figma file `WINlSqzt8h2R3EE2pfPVzG` ("MVP", Smalsuolis.lt), pulled
2026-08-21 via `GET /v1/files/:key`. Every value below comes from the JSON tree
(`absoluteBoundingBox`, `cornerRadius`, `fills`, `padding*`, `itemSpacing`,
`style.*`) — nothing was measured from a screenshot.

Refresh with:

```bash
. ~/.config/claude/secrets.sh
curl -sS -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/WINlSqzt8h2R3EE2pfPVzG" -o tree_full.json
python3 spec.py <page> <frame> --depth=4
```

## Type scale

Figma `letterSpacing` is in **px**. The em equivalents below are what the
`typography` map in `src/styles/index.ts` must carry.

| Token  | Size | Line height | Weight | Figma ls (px) | = em        |
| ------ | ---- | ----------- | ------ | ------------- | ----------- |
| `6xl`  | 64   | 77 (1.2)    | 700    | −3.20         | **−0.05em** |
| `5xl`  | 48   | 72 (1.5)    | 400    | −2.40         | **−0.05em** |
| `3xl`  | 30   | 39 (1.3)    | 500    | −1.50         | **−0.05em** |
| `2xl`  | 24   | 31 (1.3)    | 500    | −0.48         | **−0.02em** |
| `xl`   | 20   | 30 (1.5)    | 400    | −0.40         | **−0.02em** |
| `lg`   | 18   | 27 (1.5)    | 400    | −0.36         | **−0.02em** |
| `base` | 16   | 24 (1.5)    | 400    | −0.32         | **−0.02em** |

Mobile `Main Heading` is `3xl` at **weight 800** (not 500).

## Colours

| Role                           | Hex         | Where                                         |
| ------------------------------ | ----------- | --------------------------------------------- |
| Text primary                   | **#000000** | all headings, nav links, labels, stat labels  |
| Text muted (intro)             | **#818181** | homepage/apie-mus intro paragraph             |
| Text meta                      | **#333333** | event row title, location, date, category tag |
| Text counts                    | **#707070** | category pill counts                          |
| Hero green                     | **#7EEC9B** | hero band, desktop **and** mobile             |
| Divider (event rows)           | **#D6D6D6** | row bottom border, separator dot              |
| Divider (nav, pills, sections) | **#DDDDDD** | navbar bottom border, pill border, `Line`     |
| Search card border             | **#D4D3D3** | hero search card                              |
| Input border / placeholder     | **#BCBCBC** | all form inputs                               |
| Page background                | **#FFFFFF** | every frame                                   |
| Band background                | **#FAFAFA** | Apie mus grey band                            |

## Navbar (all pages)

- Frame `1440x80`, padding `16/56/16/56`, content `1328x44`
- Nav links `16px/24 w400 ls−0.32 #000000`, gap **36**
- Items: Pagrindinis · Žemėlapis · **Prenumeratos** · Statistika · Apie mus
- Inner pages (Prenumeratos / Profilis / Statistika / Ivykiai): `bg #FFFFFF`
  plus `border-bottom #DDDDDD 1px`
- Homepage / Apie mus: transparent over the green hero, no border

## Homepage

**Hero band** `1440x436`, `bg #7EEC9B`, heading at y=160.

**Search card** `1312x140` — padding **42**, gap **10**, `r=28`,
`bg #FFFFFF`, `border #D4D3D3 1px`.

| Child          | Size       | Radius | Border                     |
| -------------- | ---------- | ------ | -------------------------- |
| Address input  | 738x56     | 44     | #BCBCBC 1px                |
| Sritys select  | 300x56     | 44     | #BCBCBC 1px                |
| Ieškoti button | **170x56** | 54     | — (`bg #000000`, pad 8/24) |

**Stat row** — block gap **112**, no gap between number and label.
Number `48px/72 w400 #000000`; label `20px/30 w400 #000000`.

**Category pills** — row gap **16**; pill height **43**, padding **8/12/8/12**,
inner gap **14**, `r=39`, `bg #FFFFFF`, `border #DDDDDD 1px`.
Count text `18px/27 w400 #707070`.

**Event rows** — padding `0/0/32/0`, inner gap **22**, list gap **32**,
`border-bottom #D6D6D6 1px` (last row none).

| Element         | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Title           | `24px/31 w500 ls−0.48 #333333`                                            |
| Location / date | `20px/30 w400 ls−0.40 #333333`                                            |
| Separator dot   | ellipse 5x5 `#D6D6D6`                                                     |
| Category tag    | h48, pad `12/20`, `r=128`, `bg #FFFFFF`, `border #DDDDDD`, text `#333333` |

**CTA band** `1440x538`, gap 24.

- Left panel `836x538`, `r 0/20/20/0`, overlay gradient `#7EEC9B @0.30 → #20853B`,
  heading `48px/72 w400 ls−2.40 #FFFFFF`
- Right panel `580x538`, `r 20/0/0/20`, `bg #000000`
- Right content column 420 wide, gap **40** (text block → button), text block gap **20**
- Title `30px/39 w500 #FFFFFF`, body `18px/27 w400 #FFFFFF`
- Button `420x56`, pad `8/24`, `r=54`, `bg #FFFFFF`, text `16px/24 #000000`

**Footer** — copyright `16px/24 w400 ls−0.32 #000000`; the team column carries a
`Mūsų komanda` link that the implementation is missing.

**Copy** — hero mission line reads "Sužinok **pirmasis**, kas planuojama šalia tavęs."

## Profilis

Column **599** wide, centred (x=421 on 1440), title→form gap **37**,
form inner gap **29**, field gap **24**.

Field block `599x72` = label (24) + 8 + control (40):

- Label `16px/24 w400 ls−0.32 #000000`
- Control `599x40`, `bg #FFFFFF`, `border #BCBCBC 1px`, fully rounded
  (Figma carries r=64 on the first field and r=34 on the rest; at 40px tall
  both clamp to a pill, so use `border-radius: 100px`)
- Text inset 12px from the left edge
- Placeholder `#BCBCBC`, entered value `#000000`, both `16px/24 w400`
- Trailing eye icon 20x20, 12px from the right edge

Button `141x40`, pad `8/24`, `r=54`, `bg #000000`, text `16px/24 w400 #FFFFFF`.

## Prenumeratos

- Title `30px/39 w500 ls−1.50 #000000`
- "Pridėti naują" button **165x40**, pad `8/24`, `r=54`, `bg #000000`, gap 4
- Rows: padding `0/0/24/0`, gap **24**, `border-bottom #D6D6D6 1px`
  (note: different from the homepage event rows, which use 32/22)

## Statistika

Content 1325 wide, section gap **48**, separators `Line #DDDDDD 1px`,
black summary card `1336x379` `r=20` `bg #000000`.

## Zemelapis

Filter controls `418x40` / `300x40` / `206x40`, `r=128` (pill), `bg #FFFFFF`,
text `16px/24 w400 #000000`. Action button `210x40`, pad `8/24`, `r=54`.

## Apie mus

Hero identical to the homepage (green 436 band, 1312x140 search card, stat row
gap 112). Main heading `64px/77 w700 ls−3.20`. Grey band `#FAFAFA`, 474 tall.
