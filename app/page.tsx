"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  label: string;
  file: string;
  color: string;
};

const TRACKS: Track[] = [
  {
    id: "stream-flow",
    label: "Stream",
    file: "alex_jauk-calm-stream-flowing-191143.mp3",
    color: "#c8f55a",
  },
  {
    id: "zen-river",
    label: "Zen River",
    file: "alex_jauk-calm-zen-river-flowing-228223.mp3",
    color: "#5af5c8",
  },
  {
    id: "cricket-soft",
    label: "Cricket Soft",
    file: "felix_quinol-cricket-sound-113945.mp3",
    color: "#f55a9b",
  },
  {
    id: "cricket-loop",
    label: "Cricket Loop",
    file: "freesound_community-cricket-single-pretty-clean-internal-loop-badlands-ab-190818-26034.mp3",
    color: "#f5c85a",
  },
  {
    id: "rain",
    label: "Rain",
    file: "liecio-calming-rain-257596.mp3",
    color: "#5a9bf5",
  },
  {
    id: "ocean",
    label: "Ocean",
    file: "marcinflorida-calm-ocean-waves-early-in-the-morning-140020.mp3",
    color: "#c85af5",
  },
  {
    id: "pad",
    label: "Ambient Pad",
    file: "samuelfjohanns-uplifting-pad-texture-113842.mp3",
    color: "#8ef55a",
  },
  {
    id: "crickets-night",
    label: "Night Crickets",
    file: "u_uy2kad5rlq-crickets-395138.mp3",
    color: "#5af5dd",
  },
  {
    id: "atmosphere",
    label: "Atmosphere",
    file: "universfield-a-calm-ambient-atmosphere-158464.mp3",
    color: "#f57bc0",
  },
  {
    id: "rainy-town",
    label: "Rainy Town",
    file: "whitenoisesleepers-rainy-day-in-town-with-birds-singing-194011.mp3",
    color: "#f5db5a",
  },
  {
    id: "birds",
    label: "Birds",
    file: "zehendrew-birds-chirping-calm-173695.mp3",
    color: "#7db6ff",
  },
];

const INITIAL_VOLUMES: Record<string, number> = Object.fromEntries(
  TRACKS.map((track) => [track.id, 0.65]),
);

export default function Home() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>(INITIAL_VOLUMES);

  useEffect(() => {
    const state: Record<string, HTMLAudioElement> = {};

    for (const track of TRACKS) {
      const audio = new Audio(`/${track.file}`);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = INITIAL_VOLUMES[track.id];
      state[track.id] = audio;
    }

    audioRefs.current = state;

    return () => {
      for (const audio of Object.values(state)) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const togglePlay = async (trackId: string) => {
    const audio = audioRefs.current[trackId];
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
      return;
    }

    try {
      await audio.play();
      setIsPlaying((prev) => ({ ...prev, [trackId]: true }));
    } catch {
      setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
    }
  };

  const changeVolume = (trackId: string, value: number) => {
    const audio = audioRefs.current[trackId];
    if (!audio) return;

    audio.volume = value;
    setVolumes((prev) => ({ ...prev, [trackId]: value }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080810] text-[#ddddf0]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:34px_34px]" />
      <div className="pointer-events-none absolute -left-28 top-[-160px] h-[520px] w-[520px] rounded-full bg-[#c8f55a]/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-28 bottom-[-160px] h-[520px] w-[520px] rounded-full bg-[#5af5c8]/10 blur-[110px]" />

      <section className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-14 sm:px-8">
        <header className="text-center">
          <h1 className="bg-gradient-to-r from-[#c8f55a] via-[#5af5c8] to-[#5a9bf5] bg-clip-text font-mono text-5xl font-bold tracking-tight text-transparent">
            AMBIENT MIXER
          </h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#55556a]">
            Calm sound layers, minimal controls
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {TRACKS.map((track) => {
            const playing = !!isPlaying[track.id];
            const volume = volumes[track.id] ?? 0.65;

            return (
              <article
                key={track.id}
                className="rounded-xl border border-[#1e1e30] bg-[#14141f]/95 px-4 py-4 backdrop-blur-sm transition-colors"
                style={{
                  borderColor: playing
                    ? `color-mix(in srgb, ${track.color} 45%, #1e1e30)`
                    : "#1e1e30",
                }}
              >
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void togglePlay(track.id)}
                    className="min-w-[88px] rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor: track.color,
                      color: playing ? "#080810" : track.color,
                      backgroundColor: playing ? track.color : "transparent",
                    }}
                  >
                    {playing ? "Stop" : "Play"}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-[#ddddf0]">
                      {track.label}
                    </p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[#55556a]">
                      {track.file}
                    </p>
                  </div>

                  <div className="flex w-[170px] items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#55556a]">
                      Vol
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(event) =>
                        changeVolume(track.id, Number(event.target.value))
                      }
                      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#1e1e30] accent-[#c8f55a] disabled:cursor-not-allowed"
                      aria-label={`Volume for ${track.label}`}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
