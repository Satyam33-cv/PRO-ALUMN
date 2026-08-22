import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AlumniCard } from "@/components/AlumniCard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

jest.mock("next/link", () => {
  const React = require("react");
  return React.forwardRef(function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }, ref: React.Ref<HTMLAnchorElement>) {
    return React.createElement("a", { href, ref, ...props }, children);
  });
});

const mockAlumni = {
  id: "al-priya",
  name: "Priya Raman",
  batch: "2018",
  company: "Northstar Labs",
  role: "Product Designer",
  location: "New York, NY",
  initials: "PR",
  match: 94,
};

describe("AlumniCard", () => {
  beforeEach(() => {
    render(<AlumniCard alumni={mockAlumni} />);
  });

  it("renders alumni initials", () => {
    expect(screen.getByText("PR")).toBeInTheDocument();
  });

  it("renders alumni name", () => {
    expect(screen.getByText("Priya Raman")).toBeInTheDocument();
  });

  it("renders batch year", () => {
    expect(screen.getByText("Class of 2018")).toBeInTheDocument();
  });

  it("renders role and company", () => {
    expect(screen.getByText(/Product Designer/)).toBeInTheDocument();
    expect(screen.getByText(/Northstar Labs/)).toBeInTheDocument();
  });

  it("renders location", () => {
    expect(screen.getByText("New York, NY")).toBeInTheDocument();
  });

  it("renders match ring when match prop is provided", () => {
    expect(screen.getByRole("img", { name: /match/i })).toBeInTheDocument();
  });

  it("does not render match ring when match is undefined", () => {
    const { container } = render(
      <AlumniCard alumni={{ ...mockAlumni, match: undefined }} />
    );
    expect(container.querySelector('[role="img"][aria-label*="match"]')).not.toBeInTheDocument();
  });

  it("links to profile page with alumni ID", () => {
    const link = screen.getByRole("link", { name: /view profile/i });
    expect(link).toHaveAttribute("href", "/directory/al-priya");
  });
});
