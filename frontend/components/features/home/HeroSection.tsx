export function HeroSection() {
  return (
    <section className="ww-container pt-20 pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12">
        <div className="flex flex-col gap-6 md:w-[58%]">
          <span className="inline-flex w-fit items-center rounded-full bg-ww-orange px-4 py-1.5 text-label-caps text-white">
            Откройте город по-новому
          </span>

          <h1 className="text-display-hero text-foreground">
            места,<br />которые<br />меняют<br />маршрут
          </h1>

          <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
            Находите кафе, парки, арт-пространства и улицы — по вайбу, времени и настроению.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a href="/explore" className="btn-accent">
              исследовать москву
            </a>
            <a href="/explore" className="btn-ghost">
              смотреть все места →
            </a>
          </div>

          <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
            <span><strong className="font-semibold text-foreground">2 000+</strong> мест</span>
            <span className="text-border">·</span>
            <span><strong className="font-semibold text-foreground">14</strong> вайбов</span>
            <span className="text-border">·</span>
            <span><strong className="font-semibold text-foreground">1</strong> город</span>
          </div>
        </div>

        <div className="relative hidden md:flex md:w-[42%] md:items-start md:justify-end">
          <div className="relative h-72 w-full max-w-sm">
            <div className="absolute right-0 top-8 h-44 w-36 rotate-3 rounded-[24px] bg-foreground/10 shadow-xl" />
            <div className="absolute right-8 top-0 h-52 w-40 -rotate-2 overflow-hidden rounded-[24px] bg-foreground/8 shadow-2xl">
              <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-300" />
              <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-3">
                <p className="text-xs font-semibold text-foreground">Дизайн-завод</p>
                <p className="text-xs text-muted-foreground">Культура</p>
              </div>
            </div>
            <div className="absolute right-4 top-16 h-44 w-36 rotate-1 overflow-hidden rounded-[24px] bg-foreground/5 shadow-xl">
              <div className="h-full w-full bg-gradient-to-br from-amber-100 to-orange-100" />
              <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-3">
                <p className="text-xs font-semibold text-foreground">Морозейка Кофе</p>
                <p className="text-xs text-muted-foreground">Кофейня</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
