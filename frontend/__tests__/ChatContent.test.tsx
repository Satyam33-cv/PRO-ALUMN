import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatContent } from "@/components/ChatContent";

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

// Mock socket
const mockSocket = {
  connect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock("@/lib/socket", () => ({
  getSocket: () => mockSocket,
}));

// Mock auth token
jest.mock("@/lib/auth", () => ({
  getToken: () => "mock-jwt-token",
}));

const mockUseApi = jest.fn();
jest.mock("@/lib/hooks/useApi", () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

// Mock apiClient
import { apiClient } from "@/lib/api/client";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    chat: {
      list: jest.fn(),
      sendMessage: jest.fn().mockResolvedValue({ id: "server-msg-1", text: "ok" }),
      getThread: jest.fn().mockResolvedValue({ messages: [] }),
    },
  },
}));

const mockThreads = [
  {
    id: "thread-1",
    name: "Sarah Jenkins",
    title: "Principal Architect @ Snowflake",
    cohort: "COHORT '16",
    pgp: "PGP: 0x9AF4..C21",
    category: "1:1",
    statusBadge: "ACTIVE P2P",
    statusColor: "bg-[#ffdbcf] text-[#a63500]",
    lastMessage: "Benchmarking SIMD pass complete on Snowflake cluster.",
    subTag: "FL-9021",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isEscrowActive: true,
    escrowAmount: 30,
  },
  {
    id: "thread-2",
    name: "David Chen",
    title: "Founder @ Neuromorphic Labs",
    cohort: "COHORT '17",
    pgp: "PGP: 0x8BC1..A19",
    category: "FOUNDER",
    statusBadge: "ACTIVE P2P",
    statusColor: "bg-[#ffdbcf] text-[#a63500]",
    lastMessage: "Reviewing YC W26 cohort silicon schematics for Neuromorphic processing.",
    subTag: "FL-8812",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isEscrowActive: false,
    escrowAmount: 0,
  },
  {
    id: "thread-3",
    name: "Ananya Deshmukh",
    title: "Quantum Compiler Fellow @ Q-Core",
    cohort: "COHORT '19",
    pgp: "PGP: 0x7CD3..B04",
    category: "1:1",
    statusBadge: "STANDBY",
    statusColor: "bg-[#e5e2dc] text-[#635F57]",
    lastMessage: "Awaiting pulse calibration benchmarks.",
    subTag: "FL-7703",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    isEscrowActive: false,
    escrowAmount: 0,
  },
];

const mockThread1Messages = [
  {
    id: "msg-1",
    senderId: "sarah",
    senderName: "Sarah Jenkins",
    senderCohort: "COHORT '16",
    time: "10:38 AM",
    text: "Reviewing the vectorized batch dispatch for query predicate evaluations.",
    sent: false,
    signature: "SIG_0x42FA",
    codeSnippet: {
      filename: "SNOWFLAKE_COLUMN_STORE // OPT_V4.RS",
      tag: "ASM//SIMD",
      code: "pub struct VectorizedRegisterBatch;\n#[target_feature(enable = \"avx512f\")]\nunsafe fn eval_batch() { ... }",
    },
    attachment: {
      name: "diff_bench_avx512_run09.json",
      metric: "+14.8% MFLOPS",
    },
  },
];

describe("ChatContent (Unified Messaging & Advisory Conduit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue({
      data: { threads: mockThreads },
      error: undefined,
      isLoading: false,
      isValidating: false,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
    (apiClient.chat.getThread as jest.Mock).mockResolvedValue({ messages: mockThread1Messages });
    (apiClient.chat.list as jest.Mock).mockResolvedValue({ threads: mockThreads });
  });

  it("renders the telemetry sub-header strip and node indicators", () => {
    render(<ChatContent />);

    expect(screen.getByText("NODE//COMM-04")).toBeInTheDocument();
    expect(
      screen.getByText("ADVISORY CONDUIT & REAL-TIME ESCROW DISPATCH")
    ).toBeInTheDocument();
    expect(screen.getByText(/E2E RATIFIED \/\/ SHA-256 ENCLAVE/i)).toBeInTheDocument();
    expect(screen.getByText("90 ALUMN-CR")).toBeInTheDocument();
    expect(screen.getByText("SYNCHRONOUS FLASH")).toBeInTheDocument();
  });

  it("renders left split-pane indexed channels and diagnostics box", () => {
    render(<ChatContent />);

    expect(screen.getByText("INDEXED CHANNELS")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/grep thread, cohort, tag.../i)).toBeInTheDocument();
    expect(screen.getByText("[ ALL CONVERSATIONS ]")).toBeInTheDocument();
    expect(screen.getByText("[ 1:1 ADVISORY ]")).toBeInTheDocument();
    expect(screen.getByText("[ ESCROW ACTIVE ]")).toBeInTheDocument();

    // Diagnostics status box
    expect(screen.getByText("P2P WEBSOCKET")).toBeInTheDocument();
    expect(screen.getByText("WSS://OK")).toBeInTheDocument();
    expect(screen.getByText(/PACKET DROP: 0.00%/i)).toBeInTheDocument();
    expect(screen.getByText(/CIPHER: AES-GCM-256/i)).toBeInTheDocument();
  });

  it("renders active advisory partner header with bio, countdown, and escrow release button", () => {
    render(<ChatContent />);

    // Active thread partner
    expect(screen.getAllByText("Sarah Jenkins")[0]).toBeInTheDocument();
    expect(screen.getAllByText("COHORT '16")[0]).toBeInTheDocument();
    expect(screen.getByText("PGP: 0x9AF4..C21")).toBeInTheDocument();
    expect(screen.getByText(/SESSION COUNTDOWN/i)).toBeInTheDocument();
    expect(screen.getByText(/T-MINUS/i)).toBeInTheDocument();

    // Escrow action CTA
    expect(
      screen.getByRole("button", { name: /END MENTORSHIP & RELEASE 30 CR/i })
    ).toBeInTheDocument();
  });

  it("renders smart contract enclave notice, code artifacts, and diff benchmarks", async () => {
    render(<ChatContent />);

    // System enclave notice
    expect(screen.getByText("SMART CONTRACT ESCROW ENGAGED")).toBeInTheDocument();
    expect(screen.getByText("BLOCK #194,821")).toBeInTheDocument();

    // Code snippet artifact
    expect(
      await screen.findByText("SNOWFLAKE_COLUMN_STORE // OPT_V4.RS")
    ).toBeInTheDocument();
    expect(screen.getByText("ASM//SIMD")).toBeInTheDocument();
    expect(
      screen.getByText(/VectorizedRegisterBatch/i)
    ).toBeInTheDocument();

    // Attached diff artifact
    expect(screen.getByText("diff_bench_avx512_run09.json")).toBeInTheDocument();
    expect(screen.getByText("+14.8% MFLOPS")).toBeInTheDocument();
  });

  it("filters threads when searching via grep input", () => {
    render(<ChatContent />);

    const searchInput = screen.getByPlaceholderText(/grep thread, cohort, tag.../i);
    fireEvent.change(searchInput, { target: { value: "Neuromorphic" } });

    expect(screen.getByText("David Chen")).toBeInTheDocument();
    expect(screen.queryByText("Ananya Deshmukh")).not.toBeInTheDocument();
  });

  it("allows typing and transmitting a new message", async () => {
    render(<ChatContent />);

    const textarea = screen.getByPlaceholderText(
      /Draft message or attach cryptographic code artifact.../i
    );
    const sendBtn = screen.getByRole("button", { name: /TRANSMIT/i });

    // Initial disabled state
    expect(sendBtn).toBeDisabled();

    // Type message
    fireEvent.change(textarea, { target: { value: "Benchmarking SIMD pass complete." } });
    expect(screen.getByText("32 / 2048 CHARS")).toBeInTheDocument();
    expect(sendBtn).not.toBeDisabled();

    // Click transmit
    fireEvent.click(sendBtn);

    // Verify optimistic message in stream
    await waitFor(() => {
      expect(screen.getByText("Benchmarking SIMD pass complete.")).toBeInTheDocument();
    });
  });

  it("surfaces error banner and marks message as failed when transmission fails", async () => {
    (apiClient.chat.sendMessage as jest.Mock).mockRejectedValueOnce(
      new Error("Transmission conduit timeout")
    );

    render(<ChatContent />);

    // Wait for thread to load
    expect(await screen.findByText("SNOWFLAKE_COLUMN_STORE // OPT_V4.RS")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      /Draft message or attach cryptographic code artifact.../i
    );
    const sendBtn = screen.getByRole("button", { name: /TRANSMIT/i });

    fireEvent.change(textarea, { target: { value: "Payload intended to fail" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Transmission conduit timeout")).toBeInTheDocument();
      expect(screen.getByText("TRANSMISSION FAILED")).toBeInTheDocument();
    });

    // Dismiss error banner
    const dismissBtn = screen.getByRole("button", { name: /DISMISS/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("executes smart contract escrow disbursement with confirmation", async () => {
    render(<ChatContent />);

    const escrowBtn = screen.getByRole("button", { name: /END MENTORSHIP & RELEASE 30 CR/i });
    fireEvent.click(escrowBtn);

    // Modal opens
    expect(screen.getByText("CONFIRM ESCROW RELEASE")).toBeInTheDocument();
    expect(screen.getByText(/MUTUAL HANDSHAKE & CREDIT TRANSFER/i)).toBeInTheDocument();
    expect(screen.getAllByText(/30 ALUMN-CR/i).length).toBeGreaterThanOrEqual(1);

    // Confirm button inside modal
    const confirmBtn = screen.getByRole("button", { name: /CONFIRM & RELEASE 30 CR/i });
    fireEvent.click(confirmBtn);

    // Wait for disbursement completion
    await waitFor(
      () => {
        expect(screen.getByText(/ESCROW DISBURSED \(30 CR\)/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("enforces strict zero-giving policy (no giving or donation links)", () => {
    render(<ChatContent />);

    expect(screen.queryByText(/giving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/donate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/philanthropy/i)).not.toBeInTheDocument();
  });

  it("renders EmptyState when no active threads exist", () => {
    mockUseApi.mockReturnValue({
      data: { threads: [] },
      error: undefined,
      isLoading: false,
      isValidating: false,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
    (apiClient.chat.getThread as jest.Mock).mockResolvedValue({ messages: [] });
    render(<ChatContent />);

    expect(screen.getByText("No Active Conversations")).toBeInTheDocument();
    expect(screen.getByText("No conversation channels indexed.")).toBeInTheDocument();
    expect(screen.getByText("Browse Directory →")).toBeInTheDocument();
  });
});
