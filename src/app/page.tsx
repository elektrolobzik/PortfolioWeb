"use client";
import Hero from "@/components/sections/Hero";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* HERO */}
      <Hero />

      {/* PORTFOLIO */}
      <section
        id="portfolio"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <h2 className="text-3xl md:text-4xl font-light text-center mb-10">Проекты</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <a key={i} href="#" className="group relative block overflow-hidden rounded-2xl">
              <img
                src={`/images/portfolio/${i}.jpg`}
                alt={`Проект ${i}`}
                className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.05]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="pointer-events-none absolute bottom-4 left-4 text-white opacity-0 transition group-hover:opacity-100">
                <div className="text-sm uppercase tracking-widest text-white/70">Residential</div>
                <div className="text-lg font-medium">Project {i}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
