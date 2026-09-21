import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("renders into jsdom", () => {
    render(<p>bonjour</p>);
    expect(screen.getByText("bonjour")).toBeInTheDocument();
  });
});
