import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScheduleMeetingModal from "@/components/modals/ScheduleMeetingModal";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    scheduleMeeting: jest.fn(),
  },
}));

describe("ScheduleMeetingModal", () => {
  const mockOnClose = jest.fn();
  const mockOnScheduled = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables save button when topic is empty", () => {
    render(<ScheduleMeetingModal isOpen={true} onClose={mockOnClose} onScheduled={mockOnScheduled} />);

    const topicInput = screen.getByLabelText(/topic/i);
    fireEvent.change(topicInput, { target: { value: "" } });

    const submitBtn = screen.getByRole("button", { name: /save/i });
    expect(submitBtn).toBeDisabled();
  });

  it("submits valid payload with ISO date string in user local timezone", async () => {
    (api.scheduleMeeting as jest.Mock).mockResolvedValue({
      id: "meeting-123",
      meeting_code: "123 4567 8901",
      topic: "Sprint Planning",
      passcode: "123456",
      invite_link: "http://localhost:3000/meeting/12345678901",
      scheduled_start_at: "2026-09-01T10:00:00Z",
      duration_minutes: 60,
    });

    render(<ScheduleMeetingModal isOpen={true} onClose={mockOnClose} onScheduled={mockOnScheduled} />);

    const topicInput = screen.getByLabelText(/topic/i);
    fireEvent.change(topicInput, { target: { value: "Sprint Planning" } });

    const submitBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.scheduleMeeting).toHaveBeenCalledTimes(1);
    });

    const callArg = (api.scheduleMeeting as jest.Mock).mock.calls[0][0];
    expect(callArg.topic).toBe("Sprint Planning");
    expect(mockOnScheduled).toHaveBeenCalled();
  });
});
