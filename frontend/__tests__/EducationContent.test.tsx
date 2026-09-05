import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EducationContent, MarketVideo } from "@/app/education/EducationContent";
import "@testing-library/jest-dom";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  usePathname: () => "/education",
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

// Mock WatchVideoPlayer
jest.mock("@/components/WatchVideoPlayer", () => ({
  WatchVideoPlayer: ({ title }: { title: string }) => (
    <div data-testid="mock-video-player">{title}</div>
  ),
}));

// Mock API client
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    video: {
      submit: jest.fn().mockResolvedValue({ success: true }),
      unlock: jest.fn().mockResolvedValue({ success: true }),
    },
  },
}));

const mockVideos: MarketVideo[] = [
  {
    id: "vid-1",
    title: "Mastering Distributed Consensus in Go",
    description: "Hands-on walkthrough of Raft protocol state machine replication.",
    videoUrl: "https://example.com/raft.mp4",
    priceInCredits: 0, // Free
    uploader: { name: "Dr. Arvind Kulkarni" },
  },
  {
    id: "vid-2",
    title: "Vector Compression for Real-Time Semantic Search",
    description: "Deep dive into product quantization and HNSW vector index tuning.",
    videoUrl: "https://example.com/vector.mp4",
    priceInCredits: 50, // Premium
    uploader: { name: "Sarah Jenkins" },
  },
];

describe("EducationContent (Technical Sprint Center)", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the pillar header and system hash", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    expect(screen.getByText(/\[ PILLAR \/\/ 07 \]/i)).toBeInTheDocument();
    expect(screen.getByText("Education & Technical Sprint Center")).toBeInTheDocument();
    expect(screen.getByText(/SYS_HASH: 0x89F1\.\.E312/i)).toBeInTheDocument();
  });

  it("renders all 4 metric bento cards correctly", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    expect(screen.getByText("METRIC // 01")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("Active Protocols")).toBeInTheDocument();

    expect(screen.getByText("METRIC // 02")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("Completion Velocity")).toBeInTheDocument();

    expect(screen.getByText("METRIC // 03")).toBeInTheDocument();
    expect(screen.getByText("Anti-Cheat Watchdog")).toBeInTheDocument();
  });

  it("renders Flagship Sprint 01 with syllabus stats and start button", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    expect(
      screen.getByText("Zero to Tech Lead: Distributed Systems Transition Protocol")
    ).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Elias Vance/i)).toBeInTheDocument();
    expect(screen.getByText("6 CORE / 2 CAPSTONE")).toBeInTheDocument();
    expect(screen.getByText("2 PEER VERIFIED")).toBeInTheDocument();
    expect(screen.getByText("12 HRS / WEEK")).toBeInTheDocument();
    expect(screen.getByText("START SPRINT PROTOCOL")).toBeInTheDocument();
  });

  it("filters curated engineering sprints by category", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    expect(screen.getByText("Post-Quantum Lattice Cryptography & Zero-Knowledge Verification")).toBeInTheDocument();
    expect(screen.getByText("Columnar Database Engine Architecture & SIMD Pushdown")).toBeInTheDocument();

    // Filter to Cryptography only
    fireEvent.click(screen.getByText("CRYPTOGRAPHY"));

    expect(screen.getByText("Post-Quantum Lattice Cryptography & Zero-Knowledge Verification")).toBeInTheDocument();
    expect(screen.queryByText("Columnar Database Engine Architecture & SIMD Pushdown")).not.toBeInTheDocument();

    // Switch back to All Sprints
    fireEvent.click(screen.getByText("ALL SPRINTS"));
    expect(screen.getByText("Columnar Database Engine Architecture & SIMD Pushdown")).toBeInTheDocument();
  });

  it("renders technical masterclasses and allows video playback", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    expect(screen.getByText("Technical Masterclasses & Video Runbooks")).toBeInTheDocument();
    expect(screen.getByText("Mastering Distributed Consensus in Go")).toBeInTheDocument();
    expect(screen.getByText("Vector Compression for Real-Time Semantic Search")).toBeInTheDocument();
    expect(screen.getByText("FREE SKILL")).toBeInTheDocument();
    expect(screen.getAllByText(/50 PTS/i).length).toBeGreaterThanOrEqual(1);

    // Click watch on free video
    const watchButtons = screen.getAllByText("Watch");
    fireEvent.click(watchButtons[0]);

    expect(screen.getByTestId("mock-video-player")).toBeInTheDocument();
  });

  it("opens the syllabus blueprint modal when requested", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    const inspectBtn = screen.getByText(/Inspect Syllabus PDF/i);
    fireEvent.click(inspectBtn);

    expect(screen.getByText("Sprint Curriculum Blueprint")).toBeInTheDocument();
    expect(screen.getByText(/Formal Verification & TLA\+ state specification/i)).toBeInTheDocument();
  });

  it("opens cryptographic signature validation modal", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    const verifyBtn = screen.getByText("Verify Signature →");
    fireEvent.click(verifyBtn);

    expect(screen.getByText("Cryptographic Validation")).toBeInTheDocument();
    expect(screen.getByText(/ECDSA P-384 \+ SHA-384/i)).toBeInTheDocument();
  });

  it("enrolls in a sprint when start sprint protocol is clicked", () => {
    render(<EducationContent initialVideos={mockVideos} balance={350} unlockedIds={[]} />);

    const startBtn = screen.getByText("START SPRINT PROTOCOL");
    fireEvent.click(startBtn);

    expect(
      screen.getByText(/Enrolled in Zero to Tech Lead: Distributed Systems Transition Protocol!/i)
    ).toBeInTheDocument();
  });
});
