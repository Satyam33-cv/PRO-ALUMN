import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/jobs",
}));

jest.mock("next/link", () => {
  const React = require("react");
  return React.forwardRef(function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }, ref: React.Ref<HTMLAnchorElement>) {
    return React.createElement("a", { href, ref, ...props }, children);
  });
});

jest.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Test User", email: "test@test.com", role: "student", initials: "TU", classYear: "2025", department: "CS" },
    role: "student",
    setUser: jest.fn(),
    signOut: jest.fn(),
    loading: false,
  }),
}));

import { JobListContent } from "@/components/JobListContent";

describe("JobListContent", () => {
  it("renders the career board heading", () => {
    render(<JobListContent />);
    expect(screen.getByText(/open doors/i)).toBeInTheDocument();
  });

  it("renders filter chips", () => {
    render(<JobListContent />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /full-time/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remote/i })).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<JobListContent />);
    expect(screen.getByPlaceholderText(/search job titles/i)).toBeInTheDocument();
  });

  it("renders job cards from mock data", () => {
    render(<JobListContent />);
    expect(screen.getByText("Associate Product Manager")).toBeInTheDocument();
  });

  it("searches jobs by title", async () => {
    const user = userEvent.setup();
    render(<JobListContent />);
    const input = screen.getByPlaceholderText(/search job titles/i);
    await user.type(input, "Research");
    await waitFor(() => {
      expect(screen.getByText("Research Analyst")).toBeInTheDocument();
    });
  });
});
