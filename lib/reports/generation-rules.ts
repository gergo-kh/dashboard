import type { ReportAnalysis } from "@/lib/reports/analysis";

export function buildReportGenerationRules(analysis: ReportAnalysis) {
  const coverageWarning = analysis.coverage.combinedYoyComparable
    ? "Az összevont év/év összehasonlítás csatornafedezete egyezik."
    : "Az összevont év/év összehasonlítás csatornafedezete nem egyezik vagy nincs elegendő adat, ezért összesített YoY állítást ne tegyél; csak platformonként hasonlíts, ahol az összehasonlíthatóság igaz.";

  const seasonalityRule = analysis.seasonality.available
    ? `A szezonális következtetés alapja: ${analysis.seasonality.label} Aktuális hó/hó bevételváltozás: ${analysis.seasonality.currentMomValuePct?.toFixed(1)}%, tavaly ugyanennél a hónapváltásnál: ${analysis.seasonality.priorYearMomValuePct?.toFixed(1)}%.`
    : "Nincs elég összehasonlítható történeti adat szezonalitás megállapításához. Ne nevezd a változást szezonálisnak.";

  return `
Riportelemzési szabályok:

1. Elsőként értékeld a hó/hó változást, de ne ebből vond le egyedül a következtetést.
2. Vizsgáld meg az előző év azonos hónapját is.
3. Összesített év/év számot csak akkor használj, ha az aktuális és tavalyi hónap csatornafedezete megegyezik. ${coverageWarning}
4. Ha az összesített YoY nem összehasonlítható, Meta és Google szinten külön értékelj, de csak azokon a platformokon, ahol mindkét évben van tényleges aktivitás.
5. A "szezonális", "szezon vége", "szezonális visszaesés" vagy hasonló állítást csak történeti bizonyíték mellett használd. ${seasonalityRule}
6. Ha a mostani hó/hó visszaesés ugyanabba az irányba mutat, mint tavaly ugyanebben a hónapváltásban, ezt tekintheted szezonális támogatásnak. Ha a mostani esés lényegesen mélyebb, mondd ki, hogy a szezonalitás csak részben magyarázza.
7. Ha a tavalyi hónapváltás nem mutatott hasonló visszaesést, ne magyarázd a romlást szezonalitással.
8. Használd a 3/6/12 havi trendet kontextusként. Összevont gördülő trendet csak akkor értelmezz, ha a vizsgált időszakban a csatornafedezet konzisztens.
9. Ne keverd a Meta és Google attribúciós bevételeket webshop-szintű tényleges bevétellel.
10. Ne értékelj pusztán ROAS alapján: nézd együtt a költést, bevételt/konverziós értéket, vásárlást/konverziót és CPA-t.
11. A szöveg sorrendje:
   - mi történt ebben a hónapban,
   - ez hogyan viszonyul előző hónaphoz,
   - hogyan viszonyul tavaly ugyanilyen időszakhoz,
   - mennyit magyaráz ebből a szezonális minta,
   - mit csinálunk a következő hónapban.
12. Ha nincs elég adat valamely következtetéshez, mondd ki röviden, ne találj ki magyarázatot.
13. Hangnem: rövid, közvetlen, szakmai, Gergő korábbi riportjaihoz hasonló; ne legyen vállalati vagy AI-os.
`.trim();
}
