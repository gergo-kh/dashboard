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

14. Jó eredménynél maradj tárgyilagos és kontrollált. Ne ünnepeld túl a teljesítményt, ne használj önfényező vagy túlzó megfogalmazást. Ne sugallj olyat, hogy "megoldottuk", "hátradőlhetünk", "brutális hónap", "elképzelhetetlenül jó" vagy hasonló. Inkább: "jó hónap lett", "erős eredmény", "jó irány", "van tér további kontrollált skálázásra".

15. Jó eredménynél is nevezd meg, mire figyelünk tovább. A pozitív értékelés végén mindig legyen kontrollpont: megtérülés tartása, skálázás óvatosan, nyerők továbbvitele, gyengébb részek tisztítása vagy következő teszt.

16. Gyenge eredménynél legyél egyenes, de proaktív. Mondd ki röviden, hogy a hónap gyengébb lett vagy hol romlott a hatékonyság, majd azonnal térj át arra, hogy mit csinálunk a javításért. A hangnem legyen: "látjuk a problémát, és dolgozunk rajta", nem pedig védekező vagy magyarázkodó.

17. Gyenge eredménynél ne háríts. Szezonalitásra, piacra, algoritmusra vagy külső körülményre csak akkor hivatkozz, ha az adatok ezt ténylegesen alátámasztják. Még ilyenkor is írd le, milyen konkrét lépést teszünk mi.

18. A következő lépés mindig legyen konkrét és cselekvő: például termékoptimalizálás, kulcsszóoptimalizálás, PMax elemcsoport-frissítés, célzásfinomítás, gyenge kreatívok lekapcsolása, nyerők iterálása vagy új kreatívteszt. Kerüld az üres "figyelni fogjuk" típusú mondatokat önmagukban.

19. A riport célja ügyfélbizalmat építeni: jó hónapnál nyugalmat és kontrollt, gyenge hónapnál felelősségvállalást és proaktivitást kommunikáljon.
`.trim();
}
