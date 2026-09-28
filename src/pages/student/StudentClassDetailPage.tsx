import React from 'react';
import { useParams } from 'react-router-dom';
import { PlaceholderPage } from '../shared/PlaceholderPage';

export const StudentClassDetailPage: React.FC = () => {
  const { classId } = useParams();
  return (
    <PlaceholderPage
      title={`Course Classroom (${classId || 'Class'})`}
      description="Student tabs: Stream, Classwork (Assignments & Quizzes), People, and Grades"
      targetPhase="Phase 2 (Classroom LMS)"
    />
  );
};

export default StudentClassDetailPage;
