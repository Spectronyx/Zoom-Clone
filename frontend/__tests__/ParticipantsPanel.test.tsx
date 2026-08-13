import React from "react";
import { render, screen } from "@testing-library/react";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import { Participant } from "@/types";

const mockParticipants: Participant[] = [
  {
    participant_id: "p-2",
    display_name: "Bob Guest",
    is_host: false,
    joined_at: new Date().toISOString(),
    is_muted: false,
    is_video_off: false,
  },
];

describe("ParticipantsPanel", () => {
  const mockHandlers = {
    onMuteAll: jest.fn(),
    onMuteParticipant: jest.fn(),
    onRemoveParticipant: jest.fn(),
    onMakeHost: jest.fn(),
    onClose: jest.fn(),
  };

  it("renders Mute All button when user isHost is true", () => {
    render(
      <ParticipantsPanel
        participants={mockParticipants}
        localDisplayName="Alice Host"
        isHost={true}
        isLocked={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByRole("button", { name: /mute all/i })).toBeInTheDocument();
  });

  it("does not render Mute All button when user isHost is false", () => {
    render(
      <ParticipantsPanel
        participants={mockParticipants}
        localDisplayName="Bob Guest"
        isHost={false}
        isLocked={false}
        {...mockHandlers}
      />
    );

    expect(screen.queryByRole("button", { name: /mute all/i })).not.toBeInTheDocument();
  });
});
