import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EventListContent } from "@/components/EventListContent";

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

  it("renders the Flagship Gala section with keynotes and capacity quota", () => {
    render(<EventListContent />);

    expect(screen.getByText(/ANNUAL FLAGSHIP ASSEMBLAGE \/\/ COHORT CLUSTER ALPHA/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Homecoming & Tech Gala 2026: Autonomous Systems & Next-Gen Compute/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Dr. Elena Vance")).toBeInTheDocument();
    expect(screen.getByText("Vikram Aditya")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByText(/184 \/ 300 RESERVED/i)).toBeInTheDocument();
    expect(screen.getByText("RSVP CONFIRMED • PASS IN WALLET")).toBeInTheDocument();
  });

  it("renders Drawer 02 with registered wallet passes", () => {
    render(<EventListContent />);

    expect(screen.getByText(/Your Registered Passes & Enclave Admissions/i)).toBeInTheDocument();
    expect(screen.getByText("TICKET #HG-9924")).toBeInTheDocument();
    expect(screen.getByText("TICKET #SF-1108")).toBeInTheDocument();
    expect(screen.getByText("TICKET #VIR-402")).toBeInTheDocument();
  });

  it("filters assemblages by category tabs and guarantees NO Giving category exists", () => {
    render(<EventListContent />);

    // Strict check: NO Giving or Philanthropy
    expect(screen.queryByText(/giving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/philanthropy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/donation/i)).not.toBeInTheDocument();

    // Verify allowed category buttons exist
    const technicalBtn = screen.getByRole("button", { name: /TECHNICAL SALONS & WORKSHOPS/i });
    expect(technicalBtn).toBeInTheDocument();

    fireEvent.click(technicalBtn);
    expect(screen.getByText("Global Distributed Consensus Summit")).toBeInTheDocument();
  });

  it("filters assemblages by search input query", () => {
    render(<EventListContent />);

    const searchInput = screen.getByPlaceholderText(/Query assemblages by title, hall enclave/i);
    fireEvent.change(searchInput, { target: { value: "Quantitative" } });

    expect(screen.getByText("NYC Quantitative Engineering Breakfast")).toBeInTheDocument();
    expect(screen.queryByText("Global Distributed Consensus Summit")).not.toBeInTheDocument();
  });

  it("opens and closes the QR access pass modal", () => {
    render(<EventListContent />);

    const qrButtons = screen.getAllByText("VIEW QR PASS");
    fireEvent.click(qrButtons[0]);

    expect(screen.getByText(/PASSCODE IDENTIFIER:/i)).toBeInTheDocument();
    expect(screen.getByText("Close Pass")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close Pass"));
    expect(screen.queryByText(/PASSCODE IDENTIFIER:/i)).not.toBeInTheDocument();
  });

  it("opens RSVP registration modal and confirms 1-click registration", async () => {
    render(<EventListContent />);

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
});
