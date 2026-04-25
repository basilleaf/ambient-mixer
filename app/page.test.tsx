import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import Home from "./page";

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  volume = 1;
  loop = false;
  preload = "";
  duration = 100;
  ended = false;
  src = "";

  constructor(src: string) {
    this.src = src;
    MockAudio.instances.push(this);
  }

  play = jest.fn(async () => undefined);
  pause = jest.fn(() => undefined);
  load = jest.fn(() => undefined);
}

const setSearch = (search: string) => {
  window.history.replaceState(
    null,
    "",
    `http://localhost/${search ? `?${search}` : ""}`,
  );
};

describe("Home page audio state logic", () => {
  beforeEach(() => {
    MockAudio.instances = [];
    Object.defineProperty(window, "Audio", {
      writable: true,
      value: MockAudio,
    });
    setSearch("");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("hydrates used tracks and volumes from URL and normalizes URL params", async () => {
    setSearch("playing=rain,invalid,ocean&vol_rain=0.2&vol_ocean=2");

    render(<Home />);

    expect(screen.getByText("Rain")).toBeInTheDocument();
    expect(screen.getByText("Ocean")).toBeInTheDocument();
    expect(screen.queryByText("Stream")).not.toBeInTheDocument();

    const rainSlider = screen.getByRole("slider", { name: "Volume for Rain" });
    const oceanSlider = screen.getByRole("slider", { name: "Volume for Ocean" });

    expect(rainSlider).toHaveValue("0.2");
    expect(oceanSlider).toHaveValue("1");

    await waitFor(() => {
      expect(window.location.search).toContain("playing=rain%2Cocean");
      expect(window.location.search).toContain("vol_rain=0.20");
      expect(window.location.search).toContain("vol_ocean=1.00");
    });
  });

  it("toggles show/hide unused players control for filtered state", async () => {
    setSearch("playing=rain");
    const user = userEvent.setup();

    render(<Home />);

    const showAllButton = await screen.findByRole("button", {
      name: "Show all players",
    });
    await user.click(showAllButton);

    expect(
      screen.getByRole("button", { name: "Hide unused players" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide unused players" }));
    expect(screen.getByRole("button", { name: "Show all players" })).toBeInTheDocument();
  });

  it("shows clear all for used tracks and hides it again after clearing", async () => {
    setSearch("playing=rain");
    const user = userEvent.setup();

    render(<Home />);

    const clearAllButton = await screen.findByRole("button", { name: "Clear all" });
    expect(clearAllButton).toBeInTheDocument();

    await user.click(clearAllButton);

    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("shows play all only when filtered tracks are not all playing", async () => {
    setSearch("playing=rain,ocean");
    const user = userEvent.setup();

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Play all" }),
      ).not.toBeInTheDocument();
    });

    const stopButtons = await screen.findAllByRole("button", { name: "Stop" });
    await user.click(stopButtons[0]);

    expect(screen.getByRole("button", { name: "Play all" })).toBeInTheDocument();
  });

  it("keeps looping even when duration is unavailable", async () => {
    jest.useFakeTimers();
    setSearch("playing=rain");

    render(<Home />);

    const rainPlayers = MockAudio.instances.filter((instance) =>
      instance.src.includes("liecio-calming-rain-257596.mp3"),
    );
    expect(rainPlayers).toHaveLength(2);

    const [first, second] = rainPlayers;
    first.duration = Number.NaN;
    second.duration = Number.NaN;

    await waitFor(() => {
      expect(first.play).toHaveBeenCalledTimes(1);
    });

    act(() => {
      first.ended = true;
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(second.play).toHaveBeenCalledTimes(1);
    });

    act(() => {
      second.ended = true;
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(first.play).toHaveBeenCalledTimes(2);
    });
  });

  it("reloads and retries if replay fails after ending", async () => {
    jest.useFakeTimers();
    setSearch("playing=cricket-soft");

    render(<Home />);

    const cricketPlayers = MockAudio.instances.filter((instance) =>
      instance.src.includes("felix_quinol-cricket-sound-113945.mp3"),
    );
    expect(cricketPlayers).toHaveLength(2);

    const [first, second] = cricketPlayers;
    let firstPlayCalls = 0;
    first.play.mockImplementation(async () => {
      firstPlayCalls += 1;
      if (firstPlayCalls === 2 && first.load.mock.calls.length === 0) {
        throw new Error("Replay needs reload");
      }
      return undefined;
    });

    await waitFor(() => {
      expect(first.play).toHaveBeenCalledTimes(1);
    });

    act(() => {
      first.ended = true;
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(second.play).toHaveBeenCalledTimes(1);
    });

    act(() => {
      second.ended = true;
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(first.load).toHaveBeenCalledTimes(1);
      expect(first.play.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("completes crossfade when outgoing player ends early", async () => {
    jest.useFakeTimers();
    setSearch("playing=cricket-soft");

    render(<Home />);

    const cricketPlayers = MockAudio.instances.filter((instance) =>
      instance.src.includes("felix_quinol-cricket-sound-113945.mp3"),
    );
    expect(cricketPlayers).toHaveLength(2);

    const [first, second] = cricketPlayers;
    first.duration = 9;
    second.duration = 9;

    await waitFor(() => {
      expect(first.play).toHaveBeenCalledTimes(1);
    });

    act(() => {
      first.currentTime = 6.9;
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(second.play).toHaveBeenCalledTimes(1);
    });

    act(() => {
      first.ended = true;
      first.currentTime = 9;
      jest.advanceTimersByTime(150);
    });

    act(() => {
      second.ended = true;
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(first.play.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows a countdown for each timeline slider in debug mode", async () => {
    setSearch("debug=true&playing=rain");

    render(<Home />);

    await screen.findByText("Debug timeline controls enabled");
    expect(
      screen.getByLabelText("Player 1 countdown for Rain"),
    ).toHaveTextContent("01:40.0");
    expect(
      screen.getByLabelText("Player 2 countdown for Rain"),
    ).toHaveTextContent("01:40.0");
  });

  it("exits debug mode by removing only the debug URL param", async () => {
    setSearch("debug=true&playing=rain&vol_rain=0.20");
    const user = userEvent.setup();

    render(<Home />);

    const exitButton = await screen.findByRole("button", {
      name: "Exit Debug Mode",
    });
    await user.click(exitButton);

    expect(window.location.search).toContain("playing=rain");
    expect(window.location.search).toContain("vol_rain=0.20");
    expect(window.location.search).not.toContain("debug=");
    expect(
      screen.queryByText("Debug timeline controls enabled"),
    ).not.toBeInTheDocument();
  });
});
