import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StoriesContent } from "@/components/StoriesContent";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/stories",
}));

jest.mock("next/link", () => {
  const React = require("react");
  return React.forwardRef(function MockLink(
    { children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown },
    ref: React.Ref<HTMLAnchorElement>
  ) {
    return React.createElement("a", { href, ref, ...props }, children);
  });
});

jest.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-1",
      email: "test@somaiya.edu",
      name: "Marcus Brody",
      role: "alumni",
    },
    role: "alumni",
    loading: false,
    signOut: jest.fn(),
  }),
}));

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    stories: {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "story-new" }),
      vote: jest.fn().mockResolvedValue({ hasVoted: true }),
    },
    uploads: {
      media: jest.fn().mockResolvedValue({ url: "https://supabase.co/img.png" }),
    },
  },
}));

describe("StoriesContent (Stitch Screen 10 Success Spotlight Wall)", () => {
  it("renders the protocol masthead and telemetry counters", () => {
    render(<StoriesContent />);

    expect(
      screen.getByText(/PILLAR 05 \/\/ PUBLIC DISPATCHES & PROOF OF IMPACT/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Success Spotlight/i)
    ).toBeInTheDocument();

    // Telemetry Counters
    expect(screen.getByText("184")).toBeInTheDocument();
    expect(screen.getByText("$48.2M")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
    expect(screen.getByText("94.2%")).toBeInTheDocument();
  });

  it("renders pinned flagship story with interactive endorsement", () => {
    render(<StoriesContent />);

    expect(
      screen.getByText(/Kinetix Robotics Raises \$10M Seed For Distributed Actuator Firmwares/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/SCHEMATIC \/\/ ACTUATOR TOPOLOGY V4.2/i)).toBeInTheDocument();

    const endorseBtn = screen.getByRole("button", { name: /ENDORSE DISPATCH/i });
    expect(endorseBtn).toBeInTheDocument();

    fireEvent.click(endorseBtn);
    expect(screen.getByRole("button", { name: /ENDORSED/i })).toBeInTheDocument();
  });

  it("renders verified fellow showcase cards", () => {
    render(<StoriesContent />);

    expect(
      screen.getByText(/Sarah Jenkins \('16\) Elevated To Principal Architect At Snowflake Compute/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/David Chen \('17\) Co-Founds Neuromorphic Labs \(YC W26\)/i)
    ).toBeInTheDocument();
  });

  it("filters stories using category pills", () => {
    render(<StoriesContent />);

    const ventureFilter = screen.getByText(/VENTURE & STARTUPS/i);
    fireEvent.click(ventureFilter);

    // David Chen should remain visible
    expect(
      screen.getByText(/David Chen \('17\) Co-Founds Neuromorphic Labs/i)
    ).toBeInTheDocument();

    // Sarah Jenkins (Career) should not be visible under Venture
    expect(
      screen.queryByText(/Sarah Jenkins \('16\) Elevated To Principal Architect/i)
    ).not.toBeInTheDocument();
  });

  it("filters stories using search query", () => {
    render(<StoriesContent />);

    const searchInput = screen.getByPlaceholderText(
      /SEARCH BY FELLOW NAME, COMPANY \(SNOWFLAKE, GOOGLE, STRIPE\), OR RESEARCH TOKEN/i
    );

    fireEvent.change(searchInput, { target: { value: "Snowflake" } });

    expect(
      screen.getByText(/Sarah Jenkins \('16\) Elevated To Principal Architect/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/David Chen \('17\) Co-Founds Neuromorphic Labs/i)
    ).not.toBeInTheDocument();
  });

  it("opens the milestone transmission modal", () => {
    render(<StoriesContent />);

    const transmitBtn = screen.getByText(/Transmit New Milestone/i);
    fireEvent.click(transmitBtn);

    expect(screen.getByText(/Broadcast Peer Milestone/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e\.g\. Promoted to Staff Infrastructure Architect @ DeepMind/i)
    ).toBeInTheDocument();
  });
});
