import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ControlBar from "@/components/meeting/ControlBar";

jest.mock("@/store/meetingStore", () => ({
  useMeetingStore: () => ({
    showParticipants: false,
    showChat: false,
    toggleParticipants: jest.fn(),
    toggleChat: jest.fn(),
  }),
}));

jest.mock("@/store/mediaStore", () => ({
  useMediaStore: () => ({
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  }),
}));

describe("ControlBar", () => {
  it("calls onToggleMute exactly once when mute button is clicked", () => {
    const mockMute = jest.fn();
    const mockVideo = jest.fn();
    const mockScreen = jest.fn();
    const mockLeave = jest.fn();

    render(
      <ControlBar
        onToggleMute={mockMute}
        onToggleVideo={mockVideo}
        onToggleScreenShare={mockScreen}
        onLeave={mockLeave}
        participantCount={2}
        visible={true}
      />
    );

    const muteBtn = screen.getByRole("button", { name: /mute/i });
    fireEvent.click(muteBtn);

    expect(mockMute).toHaveBeenCalledTimes(1);
  });
});
