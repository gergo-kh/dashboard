export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto flex max-w-4xl flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          KonverzióHuszár
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">
          Ügyfélportál alap
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-700">
          Ez a V1 fejlesztési alap ellenőrző nézete. A termékfunkciók,
          hitelesítés, adatbázis és integrációk a következő jóváhagyott
          fázisokban készülnek el.
        </p>
      </section>
    </main>
  );
}
