"use client";

import Link from "next/link";
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
    id: "rain",
    label: "Rain",
    file: "liecio-calming-rain-257596.mp3",
    color: "#5a9bf5",
  },
  {
    id: "rainy-town",
    label: "Rainy Town",
    file: "whitenoisesleepers-rainy-day-in-town-with-birds-singing-194011.mp3",
    color: "#f5db5a",
  },
  {
    id: "ocean",
    label: "Ocean",
    file: "marcinflorida-calm-ocean-waves-early-in-the-morning-140020.mp3",
    color: "#c85af5",
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
    id: "pad",
    label: "Ambient Pad",
    file: "samuelfjohanns-uplifting-pad-texture-113842.mp3",
    color: "#8ef55a",
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
const URL_THEME_KEY = "theme";
type ThemeMode = "day" | "night";

const NIGHT_TRACK_COLORS = [
  "#ff6b47",
  "#ff4d4d",
  "#ff8a3d",
  "#ff5a36",
  "#ff9f43",
  "#ff6f61",
  "#ff7a2f",
  "#f25c54",
  "#ff8f5c",
  "#ff7043",
  "#ffb84d",
];

const THEME_PALETTE: Record<
  ThemeMode,
  {
    pageBg: string;
    pageText: string;
    gridLine: string;
    orbLeft: string;
    orbRight: string;
    navLink: string;
    subtitle: string;
    debugText: string;
    debugButton: string;
    playAll: string;
    cardBorder: string;
    cardBg: string;
    sliderRail: string;
    secondaryText: string;
    trackTitle: string;
    timelineOne: string;
    timelineTwo: string;
    clearLink: string;
  }
> = {
  day: {
    pageBg: "#080810",
    pageText: "#ddddf0",
    gridLine: "rgba(255,255,255,0.02)",
    orbLeft: "rgba(200,245,90,0.10)",
    orbRight: "rgba(90,245,200,0.10)",
    navLink: "#7db6ff",
    subtitle: "#55556a",
    debugText: "#7d7d94",
    debugButton: "#f55a6a",
    playAll: "#c8f55a",
    cardBorder: "#1e1e30",
    cardBg: "rgba(20,20,31,0.95)",
    sliderRail: "#1e1e30",
    secondaryText: "#55556a",
    trackTitle: "#ddddf0",
    timelineOne: "#7db6ff",
    timelineTwo: "#f5db5a",
    clearLink: "#f5db5a",
  },
  night: {
    pageBg: "#040202",
    pageText: "#ffc2a1",
    gridLine: "rgba(255,140,90,0.08)",
    orbLeft: "rgba(255,73,35,0.24)",
    orbRight: "rgba(255,112,45,0.2)",
    navLink: "#ff7a3c",
    subtitle: "#ff7a45",
    debugText: "#ff9b72",
    debugButton: "#ff4e3a",
    playAll: "#ff702e",
    cardBorder: "#34120c",
    cardBg: "rgba(16,5,4,0.97)",
    sliderRail: "#4a1f18",
    secondaryText: "#ff966c",
    trackTitle: "#ff7a3c",
    timelineOne: "#ff6a33",
    timelineTwo: "#ff9a3d",
    clearLink: "#ff9a3d",
  },
};

const TITLE_GRADIENT_BY_THEME: Record<ThemeMode, string> = {
  day: "linear-gradient(90deg, #c8f55a 0%, #5af5c8 22%, #e8fff2 42%, #5af5c8 50%, #5a9bf5 72%, #c8f55a 100%)",
  night:
    "linear-gradient(90deg, #ff240f 0%, #ff4a1f 22%, #ff6a1f 42%, #ff4a1f 52%, #ff2f12 74%, #ff3a16 100%)",
};

function HomeTitle({ themeMode }: { themeMode: ThemeMode }) {
  return (
    <h1 className="ambient-title-home font-mono text-5xl font-bold tracking-tight">
      <span
        className="ambient-title-home__text"
        style={{ backgroundImage: TITLE_GRADIENT_BY_THEME[themeMode] }}
      >
        AMBIENT MIXER
      </span>
    </h1>
  );
}

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

type PlayerProgress = {
  playerOneTime: number;
  playerTwoTime: number;
  duration: number;
};

const clampVolume = (value: number) => Math.min(1, Math.max(0, value));
const clampTime = (value: number, max: number) => Math.min(Math.max(value, 0), max);
const formatCountdown = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remainingSeconds.toFixed(1).padStart(4, "0")}`;
};

const restartPlayerFromBeginning = async (
  player: HTMLAudioElement,
  volume: number,
): Promise<boolean> => {
  player.currentTime = 0;
  player.volume = volume;

  try {
    await player.play();
    return true;
  } catch {
    // A few MP3s can fail replaying from an ended state until reloaded.
    player.load();
    player.currentTime = 0;
    player.volume = volume;

    try {
      await player.play();
      return true;
    } catch {
      return false;
    }
  }
};

const readThemeFromUrl = (): ThemeMode => {
  if (typeof window === "undefined") return "day";
  const params = new URLSearchParams(window.location.search);
  return params.get(URL_THEME_KEY) === "night" ? "night" : "day";
};

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
  themeMode: ThemeMode,
) => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  const playingTrackIds = TRACKS.filter(
    (track) => !!selectedInUrl[track.id],
  ).map((track) => track.id);

  // Always clear our own params first to avoid stale audio state in the URL.
  params.delete(URL_PLAYING_KEY);
  params.delete(URL_THEME_KEY);
  for (const track of TRACKS) {
    params.delete(`${URL_VOLUME_PREFIX}${track.id}`);
  }
  params.set(URL_THEME_KEY, themeMode);

  if (playingTrackIds.length > 0) {
    params.set(URL_PLAYING_KEY, playingTrackIds.join(","));
    for (const trackId of playingTrackIds) {
      const volume = clampVolume(
        volumes[trackId] ?? INITIAL_VOLUMES[trackId] ?? 0.65,
      );
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
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [selectedInUrl, setSelectedInUrl] = useState<Record<string, boolean>>(
    {},
  );
  const [isHydratedFromUrl, setIsHydratedFromUrl] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("day");
  const [visibleTrackIds, setVisibleTrackIds] = useState<Set<string> | null>(
    null,
  );
  const [volumes, setVolumes] =
    useState<Record<string, number>>(INITIAL_VOLUMES);
  const [playerProgress, setPlayerProgress] = useState<
    Record<string, PlayerProgress>
  >(
    TRACKS.reduce<Record<string, PlayerProgress>>((acc, track) => {
      acc[track.id] = { playerOneTime: 0, playerTwoTime: 0, duration: 1 };
      return acc;
    }, {}),
  );
  const volumesRef = useRef<Record<string, number>>(INITIAL_VOLUMES);
  const palette = THEME_PALETTE[themeMode];

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

  const updateTrackProgress = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    const [playerOne, playerTwo] = runtime.players;
    const playerOneDuration = Number.isFinite(playerOne.duration) && playerOne.duration > 0
      ? playerOne.duration
      : 0;
    const playerTwoDuration = Number.isFinite(playerTwo.duration) && playerTwo.duration > 0
      ? playerTwo.duration
      : 0;
    const duration = Math.max(playerOneDuration, playerTwoDuration, 1);

    setPlayerProgress((prev) => ({
      ...prev,
      [trackId]: {
        playerOneTime: clampTime(playerOne.currentTime, duration),
        playerTwoTime: clampTime(playerTwo.currentTime, duration),
        duration,
      },
    }));
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
    updateTrackProgress(trackId);
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

    void restartPlayerFromBeginning(incoming, 0).then((didStart) => {
      if (!didStart) {
        stopCrossfade(runtime);
      }
    });

    runtime.crossfadeId = window.setInterval(() => {
      if (!runtime.playing || runtime.crossfadeStartTime === null) {
        stopCrossfade(runtime);
        return;
      }

      const outgoing = runtime.players[fromIndex];
      const completeCrossfade = () => {
        outgoing.pause();
        outgoing.currentTime = 0;
        runtime.activeIndex = toIndex;
        stopCrossfade(runtime);
        applyVolumes(trackId);
        updateTrackProgress(trackId);
      };

      applyVolumes(trackId);
      updateTrackProgress(trackId);

      if (outgoing.ended) {
        completeCrossfade();
        return;
      }

      const elapsedSeconds =
        outgoing.currentTime - runtime.crossfadeStartTime;
      if (elapsedSeconds < runtime.crossfadeDurationSeconds) return;

      completeCrossfade();
    }, CROSSFADE_STEP_MS);
  };

  const switchToNextWithoutCrossfade = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime || !runtime.playing || runtime.crossfadeId !== null) return;

    const fromIndex = runtime.activeIndex;
    const toIndex = fromIndex === 0 ? 1 : 0;
    const outgoing = runtime.players[fromIndex];
    const incoming = runtime.players[toIndex];
    const targetVolume = volumesRef.current[trackId] ?? 0.65;

    void restartPlayerFromBeginning(incoming, targetVolume).then((didStart) => {
      if (didStart) {
        outgoing.pause();
        outgoing.currentTime = 0;
        outgoing.volume = 0;
        runtime.activeIndex = toIndex;
        return;
      }

      runtime.playing = false;
      setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
    });
  };

  const startMonitor = (trackId: string) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    if (runtime.monitorId !== null) {
      window.clearInterval(runtime.monitorId);
    }

    runtime.monitorId = window.setInterval(() => {
      if (!runtime.playing || runtime.crossfadeId !== null) return;
      updateTrackProgress(trackId);

      const active = runtime.players[runtime.activeIndex];
      // Some MP3s intermittently report non-finite duration, so keep looping by
      // handing off to the twin player if the active element reaches "ended".
      if (active.ended) {
        switchToNextWithoutCrossfade(trackId);
        return;
      }

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
    inactive.pause();
    inactive.currentTime = 0;
    inactive.volume = 0;

    const didStart = await restartPlayerFromBeginning(active, targetVolume);
    if (didStart) {
      runtime.playing = true;
      startMonitor(trackId);
      updateTrackProgress(trackId);
      setIsPlaying((prev) => ({ ...prev, [trackId]: true }));
      return;
    }

    runtime.playing = false;
    updateTrackProgress(trackId);
    setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDebugMode(params.get("debug") === "true");
    setThemeMode(readThemeFromUrl());
    setIsThemeReady(true);
    const { volumes: urlVolumes, playingIds } = readAudioStateFromUrl();
    const initialFilteredTracks =
      playingIds.size > 0 ? new Set(playingIds) : null;
    volumesRef.current = urlVolumes;
    setVolumes(urlVolumes);
    setVisibleTrackIds(initialFilteredTracks);
    setSelectedInUrl(
      TRACKS.reduce<Record<string, boolean>>((acc, track) => {
        acc[track.id] = playingIds.has(track.id);
        return acc;
      }, {}),
    );
    setIsHydratedFromUrl(true);

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
    for (const track of TRACKS) {
      updateTrackProgress(track.id);
    }

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
    if (!isHydratedFromUrl) return;
    writeAudioStateToUrl(volumes, selectedInUrl, themeMode);
  }, [isHydratedFromUrl, themeMode, volumes, selectedInUrl]);

  useEffect(() => {
    const handlePopState = () => {
      setThemeMode(readThemeFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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

  const exitDebugMode = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("debug");
    const nextSearch = url.searchParams.toString();
    const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
    window.history.replaceState(null, "", nextUrl);
    setIsDebugMode(false);
  };

  const seekTrack = async (
    trackId: string,
    nextTime: number,
    preferredActiveIndex: 0 | 1,
  ) => {
    const runtime = audioRefs.current[trackId];
    if (!runtime) return;

    const [first, second] = runtime.players;
    const firstDuration =
      Number.isFinite(first.duration) && first.duration > 0 ? first.duration : 0;
    const secondDuration =
      Number.isFinite(second.duration) && second.duration > 0 ? second.duration : 0;
    const duration = Math.max(firstDuration, secondDuration, 1);
    const seekTime = clampTime(nextTime, duration);
    const targetVolume = volumesRef.current[trackId] ?? 0.65;
    const wasPlaying = runtime.playing;

    stopCrossfade(runtime);

    if (runtime.monitorId !== null) {
      window.clearInterval(runtime.monitorId);
      runtime.monitorId = null;
    }

    first.pause();
    second.pause();

    runtime.players[preferredActiveIndex].currentTime = seekTime;

    runtime.activeIndex = preferredActiveIndex;
    runtime.players[runtime.activeIndex].volume = targetVolume;
    runtime.players[runtime.activeIndex === 0 ? 1 : 0].volume = 0;

    if (!wasPlaying) {
      runtime.playing = false;
      updateTrackProgress(trackId);
      return;
    }

    try {
      await runtime.players[runtime.activeIndex].play();
      runtime.playing = true;
      startMonitor(trackId);
      updateTrackProgress(trackId);
      setIsPlaying((prev) => ({ ...prev, [trackId]: true }));
    } catch {
      runtime.playing = false;
      updateTrackProgress(trackId);
      setIsPlaying((prev) => ({ ...prev, [trackId]: false }));
    }
  };

  const playVisibleTracks = async () => {
    const visibleIds = visibleTracks.map((track) => track.id);
    if (visibleIds.length === 0) return;

    setSelectedInUrl((prev) => {
      const next = { ...prev };
      for (const trackId of visibleIds) {
        next[trackId] = true;
      }
      return next;
    });

    for (const trackId of visibleIds) {
      if (audioRefs.current[trackId]?.playing) continue;
      await playTrack(trackId);
    }
  };

  const clearAll = () => {
    for (const track of TRACKS) {
      stopTrack(track.id);
    }

    const resetVolumes = { ...INITIAL_VOLUMES };
    volumesRef.current = resetVolumes;
    setVolumes(resetVolumes);
    setVisibleTrackIds(null);
    setSelectedInUrl(
      TRACKS.reduce<Record<string, boolean>>((acc, track) => {
        acc[track.id] = false;
        return acc;
      }, {}),
    );
  };

  const visibleTracks =
    visibleTrackIds === null
      ? TRACKS
      : TRACKS.filter((track) => visibleTrackIds.has(track.id));
  const usedTrackIds = TRACKS.filter((track) => !!selectedInUrl[track.id]).map(
    (track) => track.id,
  );
  const hasUsedTracks = usedTrackIds.length > 0;
  const isShowingAllPlayers = visibleTrackIds === null;
  const allVisibleTracksArePlaying =
    visibleTracks.length > 0 &&
    visibleTracks.every((track) => !!isPlaying[track.id]);
  const showPlayAllButton = !isShowingAllPlayers && !allVisibleTracksArePlaying;
  const isDefaultVolumeState = TRACKS.every(
    (track) => (volumes[track.id] ?? 0.65) === INITIAL_VOLUMES[track.id],
  );
  const showClearAllButton = hasUsedTracks || !isDefaultVolumeState;

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundColor: palette.pageBg,
        color: palette.pageText,
        visibility: isThemeReady ? "visible" : "hidden",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-size-[34px_34px]"
        style={{
          backgroundImage: `linear-gradient(${palette.gridLine} 1px, transparent 1px),linear-gradient(90deg,${palette.gridLine} 1px,transparent 1px)`,
        }}
      />
      <div
        className="pointer-events-none absolute -left-28 top-[-160px] h-[520px] w-[520px] rounded-full blur-[110px]"
        style={{ backgroundColor: palette.orbLeft }}
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-[-160px] h-[520px] w-[520px] rounded-full blur-[110px]"
        style={{ backgroundColor: palette.orbRight }}
      />

      <section className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-14 sm:px-8">
        <header className="relative text-center">
          <button
            type="button"
            onClick={() => {
              setThemeMode((prev) => (prev === "day" ? "night" : "day"));
            }}
            className="fixed left-[25px] top-[15px] z-20 rounded-md border bg-transparent px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition hover:opacity-85"
            style={{
              borderColor: palette.navLink,
              color: palette.navLink,
            }}
            aria-label="Theme toggle"
          >
            {themeMode === "night" ? "Night Shift" : "Day Light"}
          </button>
          <Link
            href="/about"
            className="fixed right-[25px] top-[15px] z-20 font-mono text-xs uppercase tracking-[0.14em] transition hover:opacity-85"
            style={{ color: palette.navLink }}
          >
            About
          </Link>
          <HomeTitle themeMode={themeMode} />
          <p
            className="mt-3 font-mono text-[11px] uppercase tracking-[0.28em]"
            style={{ color: palette.subtitle }}
          >
            Calm sound layers
          </p>
          {isDebugMode && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: palette.debugText }}
              >
                Debug timeline controls enabled
              </p>
              <button
                type="button"
                onClick={exitDebugMode}
                className="rounded-md border bg-transparent px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition hover:opacity-85"
                style={{
                  borderColor: palette.debugButton,
                  color: palette.debugButton,
                }}
              >
                Exit Debug Mode
              </button>
            </div>
          )}

          {showPlayAllButton && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => void playVisibleTracks()}
                className="rounded-md border bg-transparent px-5 py-2 font-mono text-xs uppercase tracking-[0.16em] transition hover:opacity-85"
                style={{
                  borderColor: palette.playAll,
                  color: palette.playAll,
                }}
              >
                Play all
              </button>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-3">
          {visibleTracks.map((track) => {
            const trackColor =
              themeMode === "night"
                ? NIGHT_TRACK_COLORS[TRACKS.findIndex((item) => item.id === track.id) % NIGHT_TRACK_COLORS.length]
                : track.color;
            const playing = !!isPlaying[track.id];
            const volume = volumes[track.id] ?? 0.65;
            const progress = playerProgress[track.id] ?? {
              playerOneTime: 0,
              playerTwoTime: 0,
              duration: 1,
            };
            const playerOneCountdown = formatCountdown(
              progress.duration - progress.playerOneTime,
            );
            const playerTwoCountdown = formatCountdown(
              progress.duration - progress.playerTwoTime,
            );

            return (
              <article
                key={track.id}
                className="rounded-xl border px-4 py-4 backdrop-blur-sm transition-colors"
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: playing
                    ? `color-mix(in srgb, ${trackColor} 45%, ${palette.cardBorder})`
                    : palette.cardBorder,
                }}
              >
                <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
                  <button
                    type="button"
                    onClick={() => void togglePlay(track.id)}
                    className="min-w-[88px] shrink-0 rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor: trackColor,
                      color: playing ? palette.pageBg : trackColor,
                      backgroundColor: playing ? trackColor : "transparent",
                    }}
                  >
                    {playing ? "Stop" : "Play"}
                  </button>

                  <div className="min-w-0 flex flex-1 items-center">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm" style={{ color: palette.trackTitle }}>
                        {track.label}
                      </p>
                      {isDebugMode && (
                        <p
                          className="truncate font-mono text-[10px] uppercase tracking-[0.14em]"
                          style={{ color: palette.debugText }}
                        >
                          {track.file}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full basis-full items-center gap-2 sm:w-[340px] sm:basis-auto">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: palette.secondaryText }}
                    >
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
                      className="h-1 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: palette.sliderRail,
                        accentColor: trackColor,
                      }}
                      aria-label={`Volume for ${track.label}`}
                    />
                  </div>

                </div>
                {isDebugMode && (
                  <div
                    className="mt-3 flex w-full flex-col gap-2 border-t pt-3"
                    style={{ borderColor: palette.cardBorder }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: palette.secondaryText }}
                      >
                        Player 1
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={progress.duration}
                        step={0.01}
                        value={progress.playerOneTime}
                        onChange={(event) =>
                          void seekTrack(track.id, Number(event.target.value), 0)
                        }
                        className="h-1 w-full cursor-pointer appearance-none rounded-full"
                        style={{
                          backgroundColor: palette.sliderRail,
                          accentColor: palette.timelineOne,
                        }}
                        aria-label={`Player 1 position for ${track.label}`}
                      />
                      <span
                        className="w-16 shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: palette.debugText }}
                        aria-label={`Player 1 countdown for ${track.label}`}
                      >
                        {playerOneCountdown}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: palette.secondaryText }}
                      >
                        Player 2
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={progress.duration}
                        step={0.01}
                        value={progress.playerTwoTime}
                        onChange={(event) =>
                          void seekTrack(track.id, Number(event.target.value), 1)
                        }
                        className="h-1 w-full cursor-pointer appearance-none rounded-full"
                        style={{
                          backgroundColor: palette.sliderRail,
                          accentColor: palette.timelineTwo,
                        }}
                        aria-label={`Player 2 position for ${track.label}`}
                      />
                      <span
                        className="w-16 shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: palette.debugText }}
                        aria-label={`Player 2 countdown for ${track.label}`}
                      >
                        {playerTwoCountdown}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {(hasUsedTracks || !isShowingAllPlayers) && (
          <div className="pt-1 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={() => {
                  if (isShowingAllPlayers) {
                    setVisibleTrackIds(new Set(usedTrackIds));
                    return;
                  }
                  setVisibleTrackIds(null);
                }}
                className="font-mono text-xs uppercase tracking-[0.14em] text-[#7db6ff] underline decoration-[#7db6ff]/60 underline-offset-4 transition hover:text-[#a9ceff]"
                style={{
                  color: palette.navLink,
                  textDecorationColor: `${palette.navLink}99`,
                }}
              >
                {isShowingAllPlayers
                  ? "Hide unused players"
                  : "Show all players"}
              </button>

              {showClearAllButton && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-4 transition hover:opacity-85"
                  style={{
                    color: palette.clearLink,
                    textDecorationColor: `${palette.clearLink}99`,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
