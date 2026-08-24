import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/network",
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

import { DirectoryContent } from "@/components/DirectoryContent";

const mockAlumni = [
  { id: "al-priya", name: "Priya Raman", batch: "2018", company: "Northstar Labs", role: "Product Designer", location: "New York, NY", initials: "PR", isMentor: true },
  { id: "al-marcus", name: "Marcus Chen", batch: "2016", company: "Fieldwork", role: "Strategy Lead", location: "Chicago, IL", initials: "MC", isMentor: false },
  { id: "al-elena", name: "Elena Torres", batch: "2020", company: "Morrow Health", role: "Data Scientist", location: "Austin, TX", initials: "ET", isMentor: true },
];

function setupSuccessMocks() {
  mockUseApi.mockReturnValue({
    data: mockAlumni,
    error: undefined,
    isLoading: false,
    isValidating: false,
    refresh: jest.fn(),
    mutate: jest.fn(),
  });
}

describe("DirectoryContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the directory heading after load", () => {
    setupSuccessMocks();
    render(<DirectoryContent />);
    expect(screen.getByText(/find your people/i)).toBeInTheDocument();
  });

  it("renders search input after load", () => {
    setupSuccessMocks();
    render(<DirectoryContent />);
    expect(screen.getByPlaceholderText(/search name/i)).toBeInTheDocument();
  });

  it("renders alumni cards after load", () => {
    setupSuccessMocks();
    render(<DirectoryContent />);
    expect(screen.getByText("Priya Raman")).toBeInTheDocument();
    expect(screen.getByText("Marcus Chen")).toBeInTheDocument();
    expect(screen.getByText("Elena Torres")).toBeInTheDocument();
  });

  it("renders filter buttons after load", () => {
    setupSuccessMocks();
    render(<DirectoryContent />);
    expect(screen.getByRole("button", { name: /batch/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /department/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /location/i })).toBeInTheDocument();
  });

  it("renders alumni count after load", () => {
    setupSuccessMocks();
    render(<DirectoryContent />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });
});
