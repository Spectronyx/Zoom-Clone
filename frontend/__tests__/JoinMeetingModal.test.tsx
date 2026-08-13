import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JoinMeetingModal from "@/components/modals/JoinMeetingModal";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

jest.mock("@/lib/api", () => ({
  api: {
    validateMeeting: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("JoinMeetingModal", () => {
  const mockClose = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("shows invalid meeting ID error when API returns valid: false", async () => {
    (api.validateMeeting as jest.Mock).mockResolvedValue({
      valid: false,
      reason: "Meeting does not exist",
    });

    render(<JoinMeetingModal isOpen={true} onClose={mockClose} />);

    const input = screen.getByPlaceholderText(/enter meeting id/i);
    fireEvent.change(input, { target: { value: "99999999999" } });

    const joinBtn = screen.getByRole("button", { name: /join/i });
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(screen.getByText(/meeting does not exist/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to lobby on valid meeting ID", async () => {
    (api.validateMeeting as jest.Mock).mockResolvedValue({ valid: true });

    render(<JoinMeetingModal isOpen={true} onClose={mockClose} />);

    const input = screen.getByPlaceholderText(/enter meeting id/i);
    fireEvent.change(input, { target: { value: "123 4567 8901" } });

    const joinBtn = screen.getByRole("button", { name: /join/i });
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/meeting/12345678901/lobby?name=Rajneesh%20Sharma");
    });
    expect(mockClose).toHaveBeenCalled();
  });
});
