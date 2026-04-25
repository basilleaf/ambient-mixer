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
});
