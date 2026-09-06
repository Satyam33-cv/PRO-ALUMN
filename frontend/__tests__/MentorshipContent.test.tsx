import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/mentorship",
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
      name: "Elena Vance",
      email: "elena@alumni.edu",
      role: "fellow",
      initials: "EV",
      classYear: "2022",
      department: "Distributed Systems",
    },
    role: "fellow",
    setUser: jest.fn(),
    signOut: jest.fn(),
    loading: false,
  }),
}));

const mockUseApi = jest.fn();
jest.mock("@/lib/hooks/useApi", () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    mentorship: {
      list: jest.fn().mockResolvedValue({ mentorships: [] }),
      create: jest.fn().mockResolvedValue({ mentorship: { id: "m-100" } }),
      updateStatus: jest.fn().mockResolvedValue({ mentorship: { id: "m-100" } }),
      confirm: jest.fn().mockResolvedValue({ mentorship: { id: "m-100" }, message: "Escrow released" }),
    },
  },
}));

import { MentorshipContent } from "@/components/MentorshipContent";

const mockMentorships = [
  {
    id: "FL-8812",
    status: "IN_FLIGHT",
    type: "15-Min Architectural Flash",
    name: "Dr. Elias Vance",
    role: "Founding Systems Architect",
    company: "Quantix Systems",
    topic: "Distributed Consensus & Raft Implementations in Go",
    credits: 30,
    lockedCredits: 30,
    countdown: "04:18",
    mentor: {
      id: "mentor-vance",
      name: "Dr. Elias Vance",
      role: "Founding Systems Architect",
      company: "Quantix Systems",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  },
  {
    id: "REV-9011",
    status: "PENDING",
    name: "Dr. Sarah Jenkins",
    topic: "LSM Tree Compaction Under Extreme Write Skew",
    badge: "Snowflake Compute",
    lockedCredits: 30,
    statusText: "WAITING MENTOR CONFIRM",
  },
];

const mockMentors = [
  {
    id: "mentor-1",
    name: "Vikram Aditya",
    role: "Staff Engineer",
    company: "Google Cloud",
    batchYear: 2018,
    domain: "DISTRIBUTED SYSTEMS",
    skills: ["Raft", "Go", "K8s"],
    availableSlots: ["10:15 AM", "02:00 PM"],
    isMentor: true,
  },
  {
    id: "mentor-2",
    name: "Sarah Jenkins",
    role: "Principal Architect",
    company: "Snowflake",
    batchYear: 2016,
    domain: "DATABASE ENGINES",
    skills: ["LSM", "Rust", "Distributed Query"],
    availableSlots: ["11:00 AM", "03:30 PM"],
    isMentor: true,
  },
  {
    id: "mentor-3",
    name: "David Chen",
    role: "Co-Founder & CEO",
    company: "Neuromorphic Labs",
    batchYear: 2017,
    domain: "HARDWARE / ASICS",
    skills: ["Verilog", "RISC-V", "Accelerators"],
    availableSlots: ["09:30 AM", "01:00 PM"],
    isMentor: true,
  },
  {
    id: "mentor-4",
    name: "Dr. Elena Rostova",
    role: "Research Scientist",
    company: "Stanford AI Lab",
    batchYear: 2019,
    domain: "AI / LLM INFRASTRUCTURE",
    skills: ["Attention", "Speculative Decoding"],
    availableSlots: ["04:00 PM"],
    isMentor: true,
  },
];

function setupMocks(mentorships: any = mockMentorships, mentors: any = mockMentors) {
  mockUseApi.mockImplementation((key: string) => {
    if (key === "mentorship:list") {
      return {
        data: mentorships,
        error: undefined,
        isLoading: false,
        loading: false,
        isValidating: false,
        refresh: jest.fn(),
        reload: jest.fn(),
        refetch: jest.fn(),
        mutate: jest.fn(),
      };
    }
    if (key === "alumni:mentorship:list") {
      return {
        data: mentors,
        error: undefined,
        isLoading: false,
        loading: false,
        isValidating: false,
        refresh: jest.fn(),
        reload: jest.fn(),
        refetch: jest.fn(),
        mutate: jest.fn(),
      };
    }
    return {
      data: null,
      error: undefined,
      isLoading: false,
      loading: false,
      isValidating: false,
      refresh: jest.fn(),
      reload: jest.fn(),
      refetch: jest.fn(),
      mutate: jest.fn(),
    };
  });
}

describe("MentorshipContent (Stitch Screen 7 Neobrutalist Redesign)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  test("renders Protocol 04 marquee, hero banner, and escrow telemetry badges", () => {
    render(<MentorshipContent />);

    // Protocol Marquee
    expect(
      screen.getByText(/PROTOCOL 04 \/\/ ASYNCHRONOUS & SYNCHRONOUS EXPERT EXCHANGE/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/TLS_1.3 \/\/ ENCLAVE_SECURE/i)).toBeInTheDocument();

    // Hero Section
    expect(
      screen.getByRole("heading", { level: 1, name: /Mentorship & Flash 1-on-1 Sessions/i })
    ).toBeInTheDocument();
    expect(screen.getByText("2,450")).toBeInTheDocument();
    expect(screen.getByText("148 Available")).toBeInTheDocument();
    expect(screen.getByText("Dual-Handshake")).toBeInTheDocument();
  });

  test("renders Active In-Flight Session card with Dr. Elias Vance and countdown timer", () => {
    render(<MentorshipContent />);

    expect(screen.getByText("SESSION ID #FL-8812")).toBeInTheDocument();
    expect(screen.getByText("Dr. Elias Vance")).toBeInTheDocument();
    expect(
      screen.getByText(/Distributed Consensus & Raft Implementations in Go/i)
    ).toBeInTheDocument();
    expect(screen.getByText("LAUNCH GOOGLE MEET")).toBeInTheDocument();
    expect(screen.getByText("PRE-FLIGHT DOSSIER")).toBeInTheDocument();
    expect(screen.getByText("RESCHEDULE")).toBeInTheDocument();
  });

  test("renders Verified Mentor Cards grid and filters by domain and search query", async () => {
    const user = userEvent.setup();
    render(<MentorshipContent />);

    // Mentors rendered
    expect(screen.getByText("Vikram Aditya")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByText("David Chen")).toBeInTheDocument();

    // Domain filtering
    const aiFilterBtn = screen.getByRole("button", { name: "AI / LLM INFRASTRUCTURE" });
    await user.click(aiFilterBtn);

    expect(screen.getByText("Dr. Elena Rostova")).toBeInTheDocument();
    expect(screen.queryByText("Vikram Aditya")).not.toBeInTheDocument();

    // Reset domain filter
    const allFilterBtn = screen.getByRole("button", { name: "ALL DOMAINS" });
    await user.click(allFilterBtn);

    // Search query filtering
    const searchInput = screen.getByPlaceholderText(/Search mentor by name, company, or tech stack/i);
    await user.type(searchInput, "Snowflake");

    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.queryByText("Vikram Aditya")).not.toBeInTheDocument();
  });

  test("switches duration modes and reflects credit updates", async () => {
    const user = userEvent.setup();
    render(<MentorshipContent />);

    // Switch to 30-Min Deep-Dive (50 CR)
    const deepDiveBtn = screen.getByRole("button", { name: "30-Min Deep-Dive (50 CR)" });
    await user.click(deepDiveBtn);

    // Buttons should now reflect 30-Min Deep-Dive
    const reserveButtons = screen.getAllByText(/RESERVE 30-MIN DEEP-DIVE/i);
    expect(reserveButtons.length).toBeGreaterThan(0);
  });

  test("opens booking modal, selects slot, and authorizes escrow lock", async () => {
    const user = userEvent.setup();
    render(<MentorshipContent />);

    // Click slot pill on Vikram Aditya's card
    const slotButton = screen.getByRole("button", { name: "10:15 AM" });
    await user.click(slotButton);

    // Booking modal opens
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("ESCROW-RESERVATION")).toBeInTheDocument();

    // Fill in agenda/topic
    const topicTextarea = screen.getByPlaceholderText(/Distributed consensus failure states in raft/i);
    await user.type(topicTextarea, "Investigate split-brain prevention under high network latency");

    // Click Authorize Escrow & Lock
    const authorizeBtn = screen.getByRole("button", { name: /AUTHORIZE ESCROW & LOCK/i });
    await user.click(authorizeBtn);

    // Verify success confirmation state
    await waitFor(() => {
      expect(screen.getByText("FLASH SESSION LOCKED IN ESCROW")).toBeInTheDocument();
    });
  });

  test("allows confirming session completion to release escrow in pending pipeline", async () => {
    const user = userEvent.setup();
    render(<MentorshipContent />);

    const confirmReleaseBtn = screen.getByRole("button", {
      name: /CONFIRM SESSION COMPLETION & RELEASE ESCROW/i,
    });
    await user.click(confirmReleaseBtn);

    await waitFor(() => {
      expect(screen.getByText(/Dual cryptographic signature accepted. 30 CR released./i)).toBeInTheDocument();
    });
  });

  test("renders standby and EmptyState when no active session or mentors are returned", () => {
    setupMocks([], []);
    render(<MentorshipContent />);
    expect(screen.getByText("ACTIVE SESSION IN-FLIGHT // STANDBY")).toBeInTheDocument();
    expect(screen.getByText("NO FELLOWS MATCH CRITERIA")).toBeInTheDocument();
  });
});
