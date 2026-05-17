export function CtaBanner() {
  return (
    <section className="ww-container pb-20">
      <div className="flex flex-col gap-4 rounded-[40px] bg-ww-orange p-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-headline-md text-white">
            начните прогулку прямо сейчас
          </h2>
          <p className="mt-1 text-body-lg text-white/80">
            добавьте любимые места и стройте маршруты по вайбу
          </p>
        </div>
        <a
          href="/map"
          className="inline-flex shrink-0 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ww-orange transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          открыть карту
        </a>
      </div>
    </section>
  );
}
