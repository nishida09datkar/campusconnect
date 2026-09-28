import React from 'react';
import { useParams } from 'react-router-dom';
import { PlaceholderPage } from '../shared/PlaceholderPage';

export const AssignmentPage: React.FC = () => {
  const { id } = useParams();
  return (
    <PlaceholderPage
      title={`Assignment Submission (${id || 'Details'})`}
      description="View problem statement, download instructor attachments, and drag-and-drop submit lab work"
      targetPhase="Phase 2 (Classroom LMS)"
    />
  );
};

export default AssignmentPage;
