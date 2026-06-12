import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AnnouncementsFeed from "./AnnouncementsFeed";

vi.mock("../hooks/useAnnouncements", () => ({
  useAnnouncements: () => ({
    announcements: [],
    isLoading: false,
    isError: false,
  }),
}));

describe("AnnouncementsFeed", () => {
  it("keeps the feed read-only without a management action", () => {
    render(
      <MemoryRouter>
        <AnnouncementsFeed />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Manage Announcements")).toBeNull();
    expect(screen.queryByText("Add Announcement")).toBeNull();
  });
});
