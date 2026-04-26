import Link from "next/link";

const CREDITS = [
  {
    name: "zehendrew",
    url: "https://pixabay.com/users/zehendrew-39650991/",
  },
  {
    name: "SamuelFJohanns",
    url: "https://pixabay.com/users/samuelfjohanns-1207793/",
  },
  {
    name: "Alex_Jauk",
    url: "https://pixabay.com/users/alex_jauk-16800354/",
  },
  {
    name: "Liecio",
    url: "https://pixabay.com/users/liecio-3298866/",
  },
  {
    name: "Universfield",
    url: "https://pixabay.com/users/universfield-28281460/",
  },
  {
    name: "MarcinFlorida",
    url: "https://pixabay.com/users/marcinflorida-32032246/",
  },
  {
    name: "WhiteNoiseSleepers",
    url: "https://pixabay.com/users/whitenoisesleepers-42647563/",
  },
  {
    name: "u_uy2kad5rlq",
    url: "https://pixabay.com/users/u_uy2kad5rlq-51801505/",
  },
  {
    name: "felix_quinol",
    url: "https://pixabay.com/users/felix_quinol-24608446/",
  },
  {
    name: "freesound_community",
    url: "https://pixabay.com/users/freesound_community-46691455/",
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080810] text-[#ddddf0]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[34px_34px]" />
      <div className="pointer-events-none absolute -left-28 top-[-160px] h-[520px] w-[520px] rounded-full bg-[#c8f55a]/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-28 bottom-[-160px] h-[520px] w-[520px] rounded-full bg-[#5af5c8]/10 blur-[110px]" />

      <section className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-14 sm:px-8">
        <header className="relative text-center">
          <Link
            href="/"
            className="fixed left-[25px] top-[15px] z-20 font-mono text-xs uppercase tracking-[0.14em] text-[#7db6ff] transition hover:text-[#a9ceff]"
          >
            Home
          </Link>
          <h1 className="bg-linear-to-r from-[#c8f55a] via-[#5af5c8] to-[#5a9bf5] bg-clip-text font-mono text-5xl font-bold tracking-tight text-transparent">
            ABOUT
          </h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#55556a]">
            Audio credits and sources
          </p>
        </header>

        <article className="rounded-xl border border-[#1e1e30] bg-[#14141f]/95 px-5 py-5 backdrop-blur-sm">
          <p className="font-mono text-sm leading-6 text-[#c3c3d6]">
            All audio sourced from{" "}
            <a
              href="https://pixabay.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[#7db6ff] underline decoration-[#7db6ff]/60 underline-offset-4 transition hover:text-[#a9ceff]"
            >
              Pixabay
            </a>
            . Huge thanks to these creators:
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {CREDITS.map((artist) => (
              <li
                key={artist.name}
                className="rounded-md border border-[#1e1e30] bg-[#10101a] px-3 py-2"
              >
                <a
                  href={artist.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sm text-[#ddddf0] underline decoration-[#7db6ff]/60 underline-offset-4 transition hover:text-[#a9ceff]"
                >
                  {artist.name}
                </a>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
