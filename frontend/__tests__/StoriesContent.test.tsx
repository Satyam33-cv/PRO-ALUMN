import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StoriesContent } from "@/components/StoriesContent";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/stories",
  useSearchParams: () => new URLSearchParams(),
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

const mockUseApi = jest.fn();
jest.mock("@/lib/hooks/useApi", () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

import { apiClient } from "@/lib/api/client";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    stories: {
      list: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: "story-new" }),
      vote: jest.fn().mockResolvedValue({ hasVoted: true }),
    },
    uploads: {
      media: jest.fn().mockResolvedValue({ url: "https://supabase.co/img.png" }),
    },
  },
}));

const mockStories = [
  {
    id: "story-1",
    index: "01",
    category: "VENTURE",
    categoryLabel: "VENTURE & STARTUPS",
    cohort: "COHORT '16",
    location: "SF / PALO ALTO",
    topologyTag: "SF",
    orgName: "KINETIX ROBOTICS",
    orgBadge: "ACTUATOR TOPOLOGY V4.2",
    authorName: "Kinetix Robotics",
    headline: "Kinetix Robotics Raises $10M Seed For Distributed Actuator Firmwares",
    role: "Founding Team",
    story: "Industrial robotics infrastructure powered by distributed hardware telemetry.",
    upvotes: 420,
    commentsCount: 18,
    metrics: {
      label1: "ATTESTATION",
      value1: "SERIES A",
      label2: "CAPITAL",
      value2: "$10.0M",
      label3: "LEAD",
      value3: "SEQUOIA",
      highlightCol: "#CCFF00",
    },
  },
  {
    id: "story-2",
    index: "02",
    category: "CAREER",
    categoryLabel: "CAREER ACCELERATION",
    cohort: "COHORT '16",
    location: "NYC / MANHATTAN",
    topologyTag: "NYC",
    orgName: "SNOWFLAKE COMPUTE",
    orgBadge: "SNOWFLAKE",
    authorName: "Sarah Jenkins",
    headline: "Sarah Jenkins ('16) Elevated To Principal Architect At Snowflake Compute",
    role: "Principal Architect",
    company: "Snowflake",
    story: "Promoted to Principal Architect leading the distributed query engine team.",
    upvotes: 312,
    commentsCount: 14,
  },
  {
    id: "story-3",
    index: "03",
    category: "VENTURE",
    categoryLabel: "VENTURE & STARTUPS",
    cohort: "COHORT '17",
    location: "SF / BAY AREA",
    topologyTag: "SF",
    orgName: "NEUROMORPHIC LABS",
    orgBadge: "YC W26",
    authorName: "David Chen",
    headline: "David Chen ('17) Co-Founds Neuromorphic Labs (YC W26)",
    role: "Co-Founder & CEO",
    company: "Neuromorphic Labs",
    story: "Building neuromorphic chips for edge intelligence.",
    upvotes: 189,
    commentsCount: 8,
  },
];

describe("StoriesContent (Stitch Screen 10 Success Spotlight Wall)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue({
      data: mockStories,
      error: undefined,
      isLoading: false,
      isValidating: false,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
  });

  it("renders the Member Console protocol masthead, omnibar, and telemetry counters", () => {
    render(<StoriesContent />);

    // Member Console Sub-Header Omnibar & Hero
    expect(screen.getByText(/MY DISPATCHES/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+ TRANSMIT MILESTONE STORY/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/FELLOW PARTICIPATION POOL/i)).toBeInTheDocument();
    expect(screen.getByText(/\+100 ALUMN-CR \/ DISPATCH/i)).toBeInTheDocument();
    expect(screen.getByText(/Success Spotlight Wall & Peer Chronicles/i)).toBeInTheDocument();

    // Telemetry Counters
    expect(screen.getByText("184")).toBeInTheDocument();
    expect(screen.getByText("$48.2M")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
    expect(screen.getByText("94.2%")).toBeInTheDocument();
  });

  it("renders pinned flagship story with interactive endorsement", () => {
    render(<StoriesContent />);

    expect(
      screen.getAllByText(/Kinetix Robotics Raises \$10M Seed For Distributed Actuator Firmwares/i).length
    ).toBeGreaterThanOrEqual(1);
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

    const ventureFilter = screen.getByRole("button", { name: /VENTURE & STARTUPS/i });
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

    const transmitBtn = screen.getAllByRole("button", { name: /\+ TRANSMIT MILESTONE STORY/i })[0];
    fireEvent.click(transmitBtn);

    expect(screen.getByText(/Broadcast Peer Milestone/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e\.g\. Promoted to Staff Infrastructure Architect @ DeepMind/i)
    ).toBeInTheDocument();
  });

  it("filters feed when clicking MY DISPATCHES", () => {
    render(<StoriesContent />);

    const myDispatchesBtn = screen.getByRole("button", { name: /MY DISPATCHES/i });
    expect(myDispatchesBtn).toBeInTheDocument();

    fireEvent.click(myDispatchesBtn);
    // Button toggles active styling
    expect(myDispatchesBtn).toHaveClass("bg-black");
  });

  it("renders EmptyState when API returns no stories", () => {
    mockUseApi.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
    render(<StoriesContent />);

    expect(screen.getByText(/No dispatches published yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Be the first verified fellow to broadcast a peer milestone/i)).toBeInTheDocument();
    expect(screen.queryByTestId("flagship-pinned-story")).not.toBeInTheDocument();
  });
});
