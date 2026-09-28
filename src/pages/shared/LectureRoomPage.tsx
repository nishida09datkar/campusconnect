import React from 'react';
import { useParams } from 'react-router-dom';
import { PlaceholderPage } from './PlaceholderPage';

export const LectureRoomPage: React.FC = () => {
  const { roomId } = useParams();
  return (
    <PlaceholderPage
      title={`Live Lecture Room (${roomId || 'Session'})`}
      description="Live multi-party interactive classroom stage, screen sharing, raised hand queue and participant roster"
      targetPhase="Phase 5 (WebRTC Calls & Live Lectures)"
    />
  );
};

export default LectureRoomPage;
