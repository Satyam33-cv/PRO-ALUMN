import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/profile",
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

const mockUseApi = jest.fn();
jest.mock("@/lib/hooks/useApi", () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

jest.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u-elena-vance",
      name: "Elena Vance",
      email: "elena@quantix.io",
      role: "alumni",
      department: "Computer Systems",
      classYear: 2022,
      initials: "EV",
    },
    role: "alumni",
    loading: false,
    signOut: jest.fn(),
    setSession: jest.fn(),
    session: null,
  }),
}));

import { ProfileContent } from "@/components/ProfileContent";

const mockProfileData = {
  data: {
    id: "u-elena-vance",
    name: "Elena Vance",
    role: "alumni",
    jobTitle: "Principal AI Systems Architect",
    currentCompany: "Quantix Systems",
    department: "Computer Systems",
    batchYear: 2022,
    bio: "Specializing in distributed tensor parallelism and zero-knowledge model attestation.",
    skills: "Distributed Systems,SIMD Microkernels,Zero-Knowledge Proofs",
    resumeUrl: "https://supabase.co/storage/resumes/elena_resume.pdf",
  },
  error: undefined,
  isLoading: false,
  refresh: jest.fn(),
};

const mockGamificationData = {
  data: {
    completeness: 95,
    badges: [],
  },
  error: undefined,
  isLoading: false,
  reload: jest.fn(),
};

function setupProfileMocks() {
  mockUseApi.mockImplementation((key: string) => {
    if (key === "profile:me") {
      return mockProfileData;
    }
    if (key === "profile:gamification") {
      return mockGamificationData;
    }
    return { data: null, isLoading: false };
  });
}

describe("ProfileContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Fellow Dossier & Digital Credential Pass headline", () => {
    setupProfileMocks();
    render(<ProfileContent />);
    expect(screen.getByText(/Fellow Dossier & Digital Credential Pass/i)).toBeInTheDocument();
  });

  it("renders fellow user name and verified role", () => {
    setupProfileMocks();
    render(<ProfileContent />);
    expect(screen.getAllByText(/Elena Vance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quantix Systems/i).length).toBeGreaterThan(0);
  });

  it("renders embedding radar and dimension gauges", () => {
    setupProfileMocks();
    render(<ProfileContent />);
    expect(screen.getByText(/02 \/\/ EMBEDDING RADAR/i)).toBeInTheDocument();
    expect(screen.getByText(/DISTRIBUTED TENSOR COMPILER/i)).toBeInTheDocument();
    expect(screen.getByText(/LATTICE CRYPTOGRAPHY/i)).toBeInTheDocument();
  });

  it("renders digital lanyard ID pass with barcode", () => {
    setupProfileMocks();
    render(<ProfileContent />);
    expect(screen.getByText(/PRO-PASS ID/i)).toBeInTheDocument();
    expect(screen.getByText(/FELLOW VERIFIED CONDUIT BADGE/i)).toBeInTheDocument();
    expect(screen.getByText(/TAP TO TRANSMIT/i)).toBeInTheDocument();
  });

  it("renders liquidity and referral slots", () => {
    setupProfileMocks();
    render(<ProfileContent />);
    expect(screen.getByText(/05 \/\/ LIQUIDITY/i)).toBeInTheDocument();
    expect(screen.getByText(/REFERRAL SLOTS/i)).toBeInTheDocument();
    expect(screen.getByText(/ALUMN-CR TOKEN/i)).toBeInTheDocument();
  });

  it("renders corridor privacy controls", () => {
    setupProfileMocks();
    render(<ProfileContent />);
    expect(screen.getByText(/06 \/\/ CORRIDOR PRIVACY/i)).toBeInTheDocument();
    expect(screen.getByText("Zero-Knowledge Mode")).toBeInTheDocument();
    expect(screen.getByText("Direct Inbound Conduits")).toBeInTheDocument();
  });
});
