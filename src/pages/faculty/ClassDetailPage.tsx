import React from 'react';
import { useParams } from 'react-router-dom';
import { PlaceholderPage } from '../shared/PlaceholderPage';

export const ClassDetailPage: React.FC = () => {
  const { classId } = useParams();
  return (
    <PlaceholderPage
      title={`Classroom Details (${classId || 'Class'})`}
      description="Tabs: Stream, Assignments, Materials, Enrolled People, Attendance, and Quizzes"
      targetPhase="Phase 2 (Classroom LMS)"
    />
  );
};

export default ClassDetailPage;
