import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { EventListContent } from "@/components/EventListContent";
import { apiClient } from "@/lib/api/client";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock AuthContext
const mockUser = {
  id: "user-123",
  name: "Dr. Elena Vance",
  email: "elena@alumni.edu",
  role: "ALUMNI",
};

jest.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signOut: jest.fn(),
  }),
}));

const mockEvents = [
  {
    id: "event-gala-2026",
    ticketCode: "HG-9924",
    title: "Homecoming & Tech Gala 2026: Autonomous Systems & Next-Gen Compute",
    category: "reunion",
    mode: "HYBRID",
    date: "OCTOBER 24, 2026",
    startsAt: "2026-10-24T18:00:00Z",
    location: "Main Campus Quadrangle & Silicon Pavilion",
    hallName: "HALL ENCLAVE ALPHA",
    description: "Annual gathering of 1,200+ engineers, researchers, and venture founders across cohorts.",
    capacity: 300,
    attending: 184,
    hasRsvp: true,
    isRegistered: true,
    keynotes: [
      { name: "Dr. Elena Vance", role: "Principal AI Architect", affiliation: "Quantix Systems", initials: "EV", topic: "Tensor Mesh Routing" },
      { name: "Vikram Aditya", role: "Staff Engineer", affiliation: "Google Cloud", initials: "VA", topic: "Distributed Consensus" },
      { name: "Sarah Jenkins", role: "Principal Architect", affiliation: "Snowflake", initials: "SJ", topic: "LSM Tree Engines" },
    ],
  },
  {
    id: "event-consensus",
    ticketCode: "SF-1108",
    title: "Global Distributed Consensus Summit",
    category: "technical",
    mode: "PHYSICAL",
    date: "NOVEMBER 12, 2026",
    startsAt: "2026-11-12T10:00:00Z",
    location: "San Francisco Engineering Hub",
    hallName: "SALON 04",
    description: "Technical deep-dive on Raft, Paxos, and BFT engines under adversarial network partitions.",
    capacity: 100,
    attending: 78,
    hasRsvp: true,
    isRegistered: true,
  },
  {
    id: "event-quant",
    ticketCode: "VIR-402",
    title: "NYC Quantitative Engineering Breakfast",
    category: "mixer",
    mode: "PHYSICAL",
    date: "NOVEMBER 20, 2026",
    startsAt: "2026-11-20T08:30:00Z",
    location: "Manhattan Financial District",
    hallName: "BOARDROOM B",
    description: "Low-latency systems, kernel bypass, and FPGA acceleration in modern electronic trading.",
    capacity: 50,
    attending: 42,
    hasRsvp: true,
    isRegistered: true,
  },
  {
    id: "event-open",
    ticketCode: "OPEN-101",
    title: "Autonomous Robotics Salon",
    category: "technical",
    mode: "PHYSICAL",
    date: "DECEMBER 05, 2026",
    startsAt: "2026-12-05T14:00:00Z",
    location: "Robotics Cleanroom A",
    hallName: "LAB 02",
    description: "Hands-on sensor fusion workshop.",
    capacity: 40,
    attending: 15,
    hasRsvp: false,
    isRegistered: false,
  },
];

// Mock apiClient
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    events: {
      list: jest.fn().mockResolvedValue([]),
      rsvp: jest.fn().mockResolvedValue({ attending: true }),
      cancelRsvp: jest.fn().mockResolvedValue({ attending: false }),
    },
  },
}));

describe("EventListContent (Events, Reunions & Capacity RSVPs)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.events.list as jest.Mock).mockResolvedValue(mockEvents);
  });

  it("renders the telemetry marquee and page hero title", () => {
    render(<EventListContent />);

    expect(
      screen.getByText(/\[PILLAR \/\/ 04\] PROTOCOL 05 \/\/ SYNCHRONOUS ALUMNI REUNIONS/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/POSTGRES SERIALIZABLE \(P2034 SAFE\)/i)).toBeInTheDocument();
    expect(screen.getByText("Events, Reunions & Capacity RSVPs")).toBeInTheDocument();
    expect(screen.getByText("Sync All to G-Cal")).toBeInTheDocument();
  });

  it("renders all 4 brutalist metric tiles", () => {
    render(<EventListContent />);

    expect(screen.getByText("ACTIVE ASSEMBLAGES")).toBeInTheDocument();
    expect(screen.getByText("SECURED PASSES")).toBeInTheDocument();
    expect(screen.getByText("ATOMIC INTEGRITY")).toBeInTheDocument();
    expect(screen.getByText("MEDIAN ATTENDANCE")).toBeInTheDocument();

    expect(screen.getByText("0.00%")).toBeInTheDocument();
    expect(screen.getByText("91.4%")).toBeInTheDocument();
  });

  it("renders the Flagship Gala section with keynotes and capacity quota", async () => {
    render(<EventListContent />);

    await waitFor(() => {
      expect(screen.getByText(/ANNUAL FLAGSHIP ASSEMBLAGE \/\/ COHORT CLUSTER ALPHA/i)).toBeInTheDocument();
    });
    expect(
      screen.getAllByText(/Homecoming & Tech Gala 2026: Autonomous Systems & Next-Gen Compute/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Dr. Elena Vance")).toBeInTheDocument();
    expect(screen.getByText("Vikram Aditya")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByText(/184 \/ 300 RESERVED/i)).toBeInTheDocument();
    expect(screen.getByText("RSVP CONFIRMED • PASS IN WALLET")).toBeInTheDocument();
  });

  it("renders Drawer 02 with registered wallet passes", async () => {
    render(<EventListContent />);

    await waitFor(() => {
      expect(screen.getByText(/Your Registered Passes & Enclave Admissions/i)).toBeInTheDocument();
    });
    expect(screen.getByText("TICKET #HG-9924")).toBeInTheDocument();
    expect(screen.getByText("TICKET #SF-1108")).toBeInTheDocument();
    expect(screen.getByText("TICKET #VIR-402")).toBeInTheDocument();
  });

  it("filters assemblages by category tabs and guarantees NO Giving category exists", async () => {
    render(<EventListContent />);

    await waitFor(() => {
      expect(screen.getByTestId("assemblage-grid")).toBeInTheDocument();
    });

    // Strict check: NO Giving or Philanthropy
    expect(screen.queryByText(/giving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/philanthropy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/donation/i)).not.toBeInTheDocument();

    // Verify allowed category buttons exist
    const technicalBtn = screen.getByRole("button", { name: /TECHNICAL SALONS & WORKSHOPS/i });
    expect(technicalBtn).toBeInTheDocument();

    fireEvent.click(technicalBtn);
    expect(
      within(screen.getByTestId("assemblage-grid")).getByText("Global Distributed Consensus Summit")
    ).toBeInTheDocument();
  });

  it("filters assemblages by search input query", async () => {
    render(<EventListContent />);

    await waitFor(() => {
      expect(screen.getByTestId("assemblage-grid")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Query assemblages by title, hall enclave/i);
    fireEvent.change(searchInput, { target: { value: "Quantitative" } });

    expect(
      within(screen.getByTestId("assemblage-grid")).getByText("NYC Quantitative Engineering Breakfast")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("assemblage-grid")).queryByText("Global Distributed Consensus Summit")
    ).not.toBeInTheDocument();
  });

  it("opens and closes the QR access pass modal", async () => {
    render(<EventListContent />);

    await waitFor(() => {
      expect(screen.getAllByText("VIEW QR PASS").length).toBeGreaterThan(0);
    });

    const qrButtons = screen.getAllByText("VIEW QR PASS");
    fireEvent.click(qrButtons[0]);

    expect(screen.getByText(/PASSCODE IDENTIFIER:/i)).toBeInTheDocument();
    expect(screen.getByText("Close Pass")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close Pass"));
    expect(screen.queryByText(/PASSCODE IDENTIFIER:/i)).not.toBeInTheDocument();
  });

  it("opens RSVP registration modal and confirms 1-click registration", async () => {
    render(<EventListContent />);

    await waitFor(() => {
      expect(screen.getAllByText(/1-CLICK RSVP PROTOCOL →/i).length).toBeGreaterThan(0);
    });

    const rsvpButtons = screen.getAllByText(/1-CLICK RSVP PROTOCOL →/i);
    fireEvent.click(rsvpButtons[0]);

    expect(screen.getByText("Confirm Seat RSVP")).toBeInTheDocument();
    expect(screen.getByText(/Admission Tier Selection/i)).toBeInTheDocument();

    const submitBtn = screen.getByText("Confirm Registration →");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/1-Click RSVP confirmed! Seat reserved with serializable lock/i)).toBeInTheDocument();
    });
  });

  it("renders EmptyState when no events are returned", async () => {
    (apiClient.events.list as jest.Mock).mockResolvedValueOnce([]);
    render(<EventListContent />);
    await waitFor(() => {
      expect(screen.getByText("NO ASSEMBLAGES MATCH QUERY PARAMETERS")).toBeInTheDocument();
    });
  });
});
