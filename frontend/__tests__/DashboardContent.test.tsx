import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/dashboard",
}));

jest.mock("next/link", () => {
  const React = require("react");
  return React.forwardRef(function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }, ref: React.Ref<HTMLAnchorElement>) {
    return React.createElement("a", { href, ref, ...props }, children);
  });
});

const mockUseApi = jest.fn();
jest.mock("@/lib/hooks/useApi", () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

import { DashboardContent } from "@/components/DashboardContent";

const mockUser = { id: "user-1", name: "Priya Raman", email: "priya@alumni.edu", role: "alumni" as const };
const mockAlumni = [{ id: "al-1", name: "Marcus Chen", batch: "2016", company: "Fieldwork", role: "Strategy Lead", location: "Chicago, IL", initials: "MC", match: 87 }];
const mockJobs = [{ id: "job-1", title: "Associate Product Manager", company: "Northstar Labs", type: "Full-time" as const, location: "New York / Hybrid", posted: "2d ago", referralAvailable: true }];
const mockRequests: unknown[] = [];

function setupSuccessMocks() {
  mockUseApi.mockReturnValue({
    data: { user: mockUser, alumni: mockAlumni, jobs: mockJobs, requests: mockRequests },
    error: undefined,
    isLoading: false,
    isValidating: false,
    refresh: jest.fn(),
    mutate: jest.fn(),
  });
}

describe("DashboardContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockUseApi.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
    render(<DashboardContent />);
    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
  });

  it("renders personalized greeting after load", async () => {
    setupSuccessMocks();
    render(<DashboardContent />);
    expect(screen.getByText(/Good morning, Priya/i)).toBeInTheDocument();
  });

  it("renders people worth knowing section", async () => {
    setupSuccessMocks();
    render(<DashboardContent />);
    expect(screen.getByText(/people worth knowing/i)).toBeInTheDocument();
  });

  it("renders open doors section", async () => {
    setupSuccessMocks();
    render(<DashboardContent />);
    expect(screen.getByText(/open doors/i)).toBeInTheDocument();
  });

  it("renders job title after load", async () => {
    setupSuccessMocks();
    render(<DashboardContent />);
    expect(screen.getByText("Associate Product Manager")).toBeInTheDocument();
  });

  it("renders alumni name after load", async () => {
    setupSuccessMocks();
    render(<DashboardContent />);
    expect(screen.getByText("Marcus Chen")).toBeInTheDocument();
  });
});
