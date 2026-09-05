import React from "react";
import { render, screen } from "@testing-library/react";
import { PublicHeader } from "@/components/PublicHeader";

let mockUser: any = null;

jest.mock("next/navigation", () => ({
  usePathname: () => "/directory",
  useRouter: () => ({ push: jest.fn() }),
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
    user: mockUser,
    role: mockUser ? mockUser.role : "student",
    signOut: jest.fn(),
    loading: false,
  }),
}));

describe("PublicHeader Component", () => {
  beforeEach(() => {
    mockUser = null;
  });

  it("renders brand logo and public guest system indicator", () => {
    render(<PublicHeader activeRoute="directory" />);

    expect(screen.getByText("///// PRO-ALUMN")).toBeInTheDocument();
    expect(screen.getByText(/SYS.V24 \/\/ NODE-ALPHA \[PUBLIC_GUEST\]/i)).toBeInTheDocument();
  });

  it("renders all public showcase navigation links and highlights active route", () => {
    render(<PublicHeader activeRoute="directory" />);

    expect(screen.getAllByText("Features")[0]).toBeInTheDocument();
    expect(screen.getAllByText("AI Matching")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Directory *")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Jobs")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Events")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Success Spotlight")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Announcements")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Education")[0]).toBeInTheDocument();
  });

  it("strictly leaves out Admin Command Center from public header", () => {
    render(<PublicHeader activeRoute="directory" />);

    expect(screen.queryByText(/admin command center/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/07 admin/i)).not.toBeInTheDocument();
  });

  it("renders Log In and Get Started buttons for guests", () => {
    render(<PublicHeader activeRoute="directory" />);

    expect(screen.getAllByText("Log In")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Get Started/i)[0]).toBeInTheDocument();
  });

  it("renders member console shortcut when user is logged in", () => {
    mockUser = {
      id: "usr-1",
      email: "alumni@somaiya.edu",
      name: "Elena Vance, Ph.D.",
      role: "alumni",
    };

    render(<PublicHeader activeRoute="directory" />);

    expect(screen.getByText(/Console \[Dashboard →\]/i)).toBeInTheDocument();
  });
});
