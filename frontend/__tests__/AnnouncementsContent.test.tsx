import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnnouncementsContent } from "@/components/AnnouncementsContent";
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/announcements",
}));

// Mock AnnouncementBody because react-markdown is an ESM module
jest.mock("@/components/AnnouncementBody", () => ({
  AnnouncementBody: ({ content }: { content: string }) => <div data-testid="announcement-body">{content}</div>,
}));

// Mock AuthContext
jest.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-101",
      name: "Dr. Elena Vance",
      email: "elena.vance@alumni.proalumn.edu",
      role: "faculty",
    },
    loading: false,
    signOut: jest.fn(),
  }),
}));

// Mock API client
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    announcements: {
      list: jest.fn().mockResolvedValue([
        {
          id: "tx-test-1",
          title: "Autonomous Robotics Labs Launching Next Month",
          category: "Deanery",
          body: "Official deanery update regarding cleanroom access protocols.",
          pinned: false,
          author: "Dean of Faculty",
          role: "Academic Deanery",
          date: "Yesterday",
        },
      ]),
      create: jest.fn().mockResolvedValue({ success: true }),
      togglePin: jest.fn().mockResolvedValue({ success: true }),
    },
  },
}));

describe("AnnouncementsContent (Neobrutalist Campus Wire)", () => {
  it("renders top utility context bar and encryption indicator", async () => {
    render(<AnnouncementsContent />);

    expect(screen.getByText(/FEED STATUS \/\/ ONLINE/i)).toBeInTheDocument();
    expect(screen.getByText(/NODE: CLUSTER-US-EAST/i)).toBeInTheDocument();
    expect(screen.getByText(/ED25519-SIGNED/i)).toBeInTheDocument();
  });

  it("renders editorial masthead and 4 quick metrics", async () => {
    render(<AnnouncementsContent />);

    expect(screen.getByText("Campus & Alumni Announcements Wire")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE TRANSMISSIONS")).toBeInTheDocument();
    expect(screen.getAllByText("PRIORITY NOTICES")[0]).toBeInTheDocument();
    expect(screen.getByText("VERIFIED DEANERY SEALS")).toBeInTheDocument();
    expect(screen.getByText("AVG DISPATCH CYCLE")).toBeInTheDocument();
    expect(screen.getByText("100% OK")).toBeInTheDocument();
  });

  it("renders pinned priority notice with Dean Arvind Kulkarni authority signature", async () => {
    render(<AnnouncementsContent />);

    expect(screen.getByText(/⚡ PRIORITY NOTICE \/\/ DEAN'S DISPATCH/i)).toBeInTheDocument();
    expect(screen.getByText(/Groundbreaking of New Advanced Autonomous Robotics & Embedded Silicon Wing/i)).toBeInTheDocument();
    expect(screen.getByText("Dr. Arvind Kulkarni, Ph.D.")).toBeInTheDocument();
    expect(screen.getByText(/RSA-4096 VALID/i)).toBeInTheDocument();
  });

  it("filters dispatches by category tabs and guarantees NO giving category exists", async () => {
    render(<AnnouncementsContent />);

    // Check all categories
    expect(screen.getByText("ALL TRANSMISSIONS")).toBeInTheDocument();
    expect(screen.getByText("DEANERY & FACULTY")).toBeInTheDocument();
    expect(screen.getByText("CAREER & HIRINGS")).toBeInTheDocument();
    expect(screen.getByText("REGIONAL CHAPTERS")).toBeInTheDocument();

    // Verify STRICTLY NO GIVING
    expect(screen.queryByText(/giving/i)).not.toBeInTheDocument();

    // Click Career tab
    fireEvent.click(screen.getByText("CAREER & HIRINGS"));

    // TechCorp should be visible
    expect(
      screen.getByText(/TechCorp Global & Snowflake Open 40\+ Fast-Track Referral Corridors/i)
    ).toBeInTheDocument();
  });

  it("opens the Broadcast Dispatch modal when clicked", async () => {
    render(<AnnouncementsContent />);

    const broadcastBtn = screen.getByText("Broadcast Dispatch");
    fireEvent.click(broadcastBtn);

    expect(screen.getByText("Broadcast Official Announcement")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Robotics Center Groundbreaking/i)).toBeInTheDocument();
  });

  it("opens the RSVP Reception modal when clicked", async () => {
    render(<AnnouncementsContent />);

    const rsvpBtn = screen.getByText("RSVP FOR CEREMONY RECEPTION");
    fireEvent.click(rsvpBtn);

    expect(screen.getByText("Reception Access")).toBeInTheDocument();
    expect(screen.getByText("Confirm Registration")).toBeInTheDocument();
  });

  it("exports calendar file when export calendar button is clicked", async () => {
    // Mock URL.createObjectURL
    window.URL.createObjectURL = jest.fn(() => "blob:http://localhost/test");

    render(<AnnouncementsContent />);

    const exportBtn = screen.getByText("EXPORT CALENDAR");
    fireEvent.click(exportBtn);

    expect(await screen.findByText(/\.ICS Calendar exported!/i)).toBeInTheDocument();
  });
});
