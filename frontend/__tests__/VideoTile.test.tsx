import React from "react";
import { render, screen } from "@testing-library/react";
import VideoTile from "@/components/meeting/VideoTile";

describe("VideoTile", () => {
  it("renders avatar fallback when video stream is null / video off", () => {
    render(
      <VideoTile
        stream={null}
        displayName="Alice Smith"
        isVideoOff={true}
      />
    );

    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders muted icon when isMuted is true", () => {
    const { container } = render(
      <VideoTile
        stream={null}
        displayName="Alice Smith"
        isMuted={true}
      />
    );

    // MicOff lucide icon has class text-zoom-red
    const micOffIcon = container.querySelector(".text-zoom-red");
    expect(micOffIcon).toBeInTheDocument();
  });

  it("applies active speaker ring class when isActiveSpeaker is true", () => {
    const { container } = render(
      <VideoTile
        stream={null}
        displayName="Alice Smith"
        isActiveSpeaker={true}
      />
    );

    const mainTile = container.firstChild as HTMLElement;
    expect(mainTile.className).toContain("ring-zoom-blue");
  });
});
