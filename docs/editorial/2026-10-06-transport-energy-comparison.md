# Car/bicycle energy and metric-unit proposal

Requested October 6, 2026 after Reddit feedback. Nate selected “Gasoline car and bicycle”; no EV comparator. This extends the pending one-way-road refinement, not the public release. Source-check date: October 6, 2026. Original model, not a measured trip, fleet average, or universal efficiency claim.

## Evidence and calculation

- 2024 Adult Compendium, ages 19–59, cycling activity 01020: 6.8 MET at 10–11.9 mph. https://pacompendium.com/bicycling/ and https://pacompendium.com/adult-compendium/
- Standard definition: 1 MET ≈ 1 kcal/kg/hour. https://pacompendium.com/
- Compendium authors caution against using standard METs to predict precise individual expenditure. https://pacompendium.com/corrected-mets/
- DOE December 16, 2024, note below FOTW 1373: EPA energy equivalence 33.7 kWh per US gallon. Only the conversion is used; the MY2024 vehicle ranges are not model inputs. https://www.energy.gov/cmei/vehicles/articles/fotw-1373-december-16-2024-efficiency-evs-model-year-2024-ranges-53-140-mpge
- NIST: 4.184 J per small calorie, hence 4184 J/kcal. https://www.nist.gov/glossary-term/26261

Illustrative baseline gasoline car: 30 US mpg, one person. 33700/30 = 1123.333333 Wh/person-mile = 698.006973 Wh/person-km. Gasoline-use equivalent: 235.214583/30 = 7.840486 L/100 km. Controls explore 15–60 US mpg and 1–4 people; total fuel use is held constant with occupancy, ignoring additional load effects.

Illustrative bike: 70 kg adult riding at 11 mph (17.702784 km/h). 6.8 × 70 / 11 = 43.272727 kcal/mile; ×4184/3600 = 50.292525 Wh/mile = 31.250326 Wh/km. Ratio = 22.335990 at the baseline. MET is not an individualized calorie measurement; rider, terrain, wind and riding style vary. Driving conditions alter fuel consumption. No confidence interval is invented. No mechanical-efficiency factor is applied to either input.

Energy boundary: gasoline chemical energy versus rider gross metabolism, including resting metabolism during cycling. Car occupants’ metabolism is excluded. Neither includes upstream food/fuel production, vehicles, roads, or emissions. Gross metabolism is not an estimate of additional food eaten. Visible copy names this asymmetry beside the comparison; do not label the ratio a lifecycle, carbon, extra-food or wheel-energy result.

## Rights and units

The Compendium homepage explicitly permits commercial use with citation and asks users not to change MET values. The proposal preserves 6.8 and cites its authors’ site; the 70 kg, 11 mph and car assumptions are original illustrative choices. DOE energy equivalence is a factual conversion, not reproduced artwork. The diagram, model, table and CSV are original project work.

US/metric toggles synchronize between new comparison and equivalent-drop chapters. Canonical physical state survives switching, including fractional conversion of slider steps. Metric physics reads kg, km/h, meters, metric tonnes and kJ. The same building geometry has a converted 42.672 m maximum; each floor remains the original illustrative 10 ft (3.048 m). Supplementary mass table exposes both lb/person and kg/person. The underlying mechanics are unchanged.

Authoring template: `src/exhibits/one-person-sixty-cars-metric.html`. New versioned entry module and comparison assets preserve all earlier packet assets and public approval identities. Keep this proposal private until a human decision and separate release authorization.


Release update — October 6: Nate explicitly authorized final polish, commit, push and merge. Final polish passed desktop, dark mobile and 320 px inspection with no material fixes. The approved implementation now uses the canonical `src/exhibits/one-person-sixty-cars.html`; alternative filenames above describe the private proposal stage. Approval and release provenance are recorded in packet `728dac013c1ebf2487dbd3a50cd1cbaabb9a7c29f6581c9ddc8f03f688cb18cc` and the release manifest. This packet restores the inherited transport script rights declaration without changing the reviewed visible content or asset bytes.
