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

const LOOP_CROSSFADE_SECONDS = 2.2;
const MONITOR_INTERVAL_MS = 120;
const CROSSFADE_STEP_MS = 40;
const URL_VOLUME_PREFIX = "vol_";
const URL_PLAYING_KEY = "playing";

type TrackAudioRuntime = {
  players: [HTMLAudioElement, HTMLAudioElement];
  activeIndex: 0 | 1;
  monitorId: number | null;
  crossfadeId: number | null;
  crossfadeStartTime: number | null;
  crossfadeDurationSeconds: number;
  crossfadeFrom: 0 | 1 | null;
  crossfadeTo: 0 | 1 | null;
  playing: boolean;
};

const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

const readAudioStateFromUrl = () => {
  const parsedVolumes: Record<string, number> = { ...INITIAL_VOLUMES };
  const playingIds = new Set<string>();

  if (typeof window === "undefined") {
    return { volumes: parsedVolumes, playingIds };
  }

  const params = new URLSearchParams(window.location.search);

  const rawPlaying = params.get(URL_PLAYING_KEY);
  if (rawPlaying) {
    for (const id of rawPlaying.split(",")) {
      const normalized = id.trim();
      if (TRACKS.some((track) => track.id === normalized)) {
        playingIds.add(normalized);
      }
    }
  }

  for (const trackId of playingIds) {
    const rawVolume = params.get(`${URL_VOLUME_PREFIX}${trackId}`);
    if (rawVolume === null) continue;
    const parsed = Number(rawVolume);
    if (Number.isFinite(parsed)) {
      parsedVolumes[trackId] = clampVolume(parsed);
    }
  }

  return { volumes: parsedVolumes, playingIds };
};

const writeAudioStateToUrl = (
  volumes: Record<string, number>,
  selectedInUrl: Record<string, boolean>,
) => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  const playingTrackIds = TRACKS.filter((track) => !!selectedInUrl[track.id]).map(
    (track) => track.id,
  );

  // Always clear our own params first to avoid stale audio state in the URL.
  params.delete(URL_PLAYING_KEY);
  for (const track of TRACKS) {
    params.delete(`${URL_VOLUME_PREFIX}${track.id}`);
  }

  if (playingTrackIds.length > 0) {
    params.set(URL_PLAYING_KEY, playingTrackIds.join(","));
    for (const trackId of playingTrackIds) {
      const volume = clampVolume(volumes[trackId] ?? INITIAL_VOLUMES[trackId] ?? 0.65);
      params.set(`${URL_VOLUME_PREFIX}${trackId}`, volume.toFixed(2));
    }
  } else {
    // Keep homepage URL clean when no tracks are active.
  }

  const nextSearch = params.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
  window.history.replaceState(null, "", nextUrl);
};

export default function Home() {
  const audioRefs = useRef<Record<string, TrackAudioRuntime>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [selectedInUrl, setSelectedInUrl] = useState<Record<string, boolean>>({});
  const [visibleTrackIds, setVisibleTrackIds] = useState<Set<string> | null>(null);
  const [volumes, setVolumes] =
    useState<Record<string, number>>(INITIAL_VOLUMES);
  const volumesRef = useRef<Record<string, number>>(INITIAL_VOLUMES);

  const applyVolumes = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    const targetVolume = volumesRef.current[trackId] ?? 0.65;
    const { players } = runtime;

    if (!runtime.playing) {
      players[0].volume = targetVolume;
      players[1].volume = 0;
      return;
    }

    if (
      runtime.crossfadeStartTime === null ||
      runtime.crossfadeFrom === null ||
      runtime.crossfadeTo === null
    ) {
      players[runtime.activeIndex].volume = targetVolume;
      players[runtime.activeIndex === 0 ? 1 : 0].volume = 0;
      return;
    }

    const elapsedSeconds =
      players[runtime.crossfadeFrom].currentTime - runtime.crossfadeStartTime;
    const progress = Math.min(
      elapsedSeconds / runtime.crossfadeDurationSeconds,
      1,
    );
    players[runtime.crossfadeFrom].volume = targetVolume * (1 - progress);
    players[runtime.crossfadeTo].volume = targetVolume * progress;
  };

  const stopCrossfade = (runtime: TrackAudioRuntime) => {
    if (runtime.crossfadeId !== null) {
      window.clearInterval(runtime.crossfadeId);
      runtime.crossfadeId = null;
    }
    runtime.crossfadeStartTime = null;
    runtime.crossfadeFrom = null;
    runtime.crossfadeTo = null;
  };

  const stopTrack = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    if (runtime.monitorId !== null) {
      window.clearInterval(runtime.monitorId);
      runtime.monitorId = null;
    }
    stopCrossfade(runtime);

    const targetVolume = volumesRef.current[trackId] ?? 0.65;
    for (let index = 0; index < runtime.players.length; index += 1) {
      const player = runtime.players[index];
      player.pause();
      player.currentTime = 0;
      player.volume = index === 0 ? targetVolume : 0;
    }

    runtime.activeIndex = 0;
    runtime.playing = false;
    setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
  };

  const startCrossfade = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime || !runtime.playing || runtime.crossfadeId !== null) return;

    const fromIndex = runtime.activeIndex;
    const toIndex = fromIndex === 0 ? 1 : 0;
    const incoming = runtime.players[toIndex];

    runtime.crossfadeFrom = fromIndex;
    runtime.crossfadeTo = toIndex;
    runtime.crossfadeStartTime = runtime.players[fromIndex].currentTime;

    incoming.currentTime = 0;
    incoming.volume = 0;
    void incoming.play().catch(() => {
      stopCrossfade(runtime);
    });

    runtime.crossfadeId = window.setInterval(() => {
      if (!runtime.playing || runtime.crossfadeStartTime === null) {
        stopCrossfade(runtime);
        return;
      }

      applyVolumes(trackId);
      const elapsedSeconds =
        runtime.players[fromIndex].currentTime - runtime.crossfadeStartTime;
      if (elapsedSeconds < runtime.crossfadeDurationSeconds) return;

      const outgoing = runtime.players[fromIndex];
      outgoing.pause();
      outgoing.currentTime = 0;
      runtime.activeIndex = toIndex;
      stopCrossfade(runtime);
      applyVolumes(trackId);
    }, CROSSFADE_STEP_MS);
  };

  const startMonitor = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    if (runtime.monitorId !== null) {
      window.clearInterval(runtime.monitorId);
    }

    runtime.monitorId = window.setInterval(() => {
      if (!runtime.playing || runtime.crossfadeId !== null) return;

      const active = runtime.players[runtime.activeIndex];
      if (!Number.isFinite(active.duration) || active.duration <= 0) return;
      const remaining = active.duration - active.currentTime;
      if (remaining <= LOOP_CROSSFADE_SECONDS) {
        startCrossfade(trackId);
      }
    }, MONITOR_INTERVAL_MS);
  };

  const playTrack = async (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime || runtime.playing) return;

    const targetVolume = volumesRef.current[trackId] ?? 0.65;
    const active = runtime.players[runtime.activeIndex];
    const inactive = runtime.players[runtime.activeIndex === 0 ? 1 : 0];
    active.currentTime = 0;
    active.volume = targetVolume;
    inactive.pause();
    inactive.currentTime = 0;
    inactive.volume = 0;

    try {
      await active.play();
      runtime.playing = true;
      startMonitor(trackId);
      setIsPlaying((prev) => ({ ...prev, [trackId]: true }));
    } catch {
      runtime.playing = false;
      setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
    }
  };

  useEffect(() => {
    const { volumes: urlVolumes, playingIds } = readAudioStateFromUrl();
    volumesRef.current = urlVolumes;
    setVolumes(urlVolumes);
    setVisibleTrackIds(playingIds.size > 0 ? new Set(playingIds) : null);
    setSelectedInUrl(
      TRACKS.reduce<Record<string, boolean>>((acc, track) => {
        acc[track.id] = playingIds.has(track.id);
        return acc;
      }, {}),
    );

    const state: Record<string, TrackAudioRuntime> = {};

    for (const track of TRACKS) {
      const first = new Audio(`/${track.file}`);
      const second = new Audio(`/${track.file}`);
      for (const player of [first, second]) {
        player.loop = false;
        player.preload = "auto";
      }
      first.volume = urlVolumes[track.id];
      second.volume = 0;

      state[track.id] = {
        players: [first, second],
        activeIndex: 0,
        monitorId: null,
        crossfadeId: null,
        crossfadeStartTime: null,
        crossfadeDurationSeconds: LOOP_CROSSFADE_SECONDS,
        crossfadeFrom: null,
        crossfadeTo: null,
        playing: false,
      };
    }

    audioRefs.current = state;

    void (async () => {
      for (const trackId of playingIds) {
        await playTrack(trackId);
      }
    })();

    return () => {
      for (const runtime of Object.values(state)) {
        if (runtime.monitorId !== null) {
          window.clearInterval(runtime.monitorId);
        }
        stopCrossfade(runtime);
        for (const player of runtime.players) {
          player.pause();
          player.currentTime = 0;
        }
      }
    };
  }, []);

  useEffect(() => {
    writeAudioStateToUrl(volumes, selectedInUrl);
  }, [volumes, selectedInUrl]);

  const togglePlay = async (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    if (runtime.playing) {
      stopTrack(trackId);
      setSelectedInUrl((prev) => ({ ...prev, [trackId]: false }));
      return;
    }

    setSelectedInUrl((prev) => ({ ...prev, [trackId]: true }));
    await playTrack(trackId);
  };

  const changeVolume = (trackId: string, value: number) => {
    volumesRef.current = { ...volumesRef.current, [trackId]: value };
    applyVolumes(trackId);
    setVolumes((prev) => ({ ...prev, [trackId]: value }));
  };

  const visibleTracks =
    visibleTrackIds === null
      ? TRACKS
      : TRACKS.filter((track) => visibleTrackIds.has(track.id));

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
            Calm sound layers
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {visibleTracks.map((track) => {
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

        {visibleTrackIds !== null && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setVisibleTrackIds(null)}
              className="font-mono text-xs uppercase tracking-[0.14em] text-[#7db6ff] underline decoration-[#7db6ff]/60 underline-offset-4 transition hover:text-[#a9ceff]"
            >
              Show all players
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
