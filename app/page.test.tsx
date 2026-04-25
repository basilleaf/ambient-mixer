import { render, screen, waitFor } from "@testing-library/react";
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
  currentTime = 0;
  volume = 1;
  loop = false;
  preload = "";
  duration = 100;
  src = "";

  constructor(src: string) {
    this.src = src;
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
    Object.defineProperty(window, "Audio", {
      writable: true,
      value: MockAudio,
    });
    setSearch("");
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
});
