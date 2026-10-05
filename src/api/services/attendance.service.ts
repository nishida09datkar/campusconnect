import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { AttendanceRecord, AttendanceEntry } from '@/types';

export interface StudentAttendanceSummary {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  history: { date: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[];
}

export interface ClassAttendanceOverview {
  totalSessions: number;
  averagePercentage: number;
  studentSummaries: {
    studentId: string;
    studentName: string;
    rollNo?: string;
    presentCount: number;
    absentCount: number;
    totalSessions: number;
    percentage: number;
  }[];
}

export const attendanceService = {
  async getClassAttendanceRecords(classId: string): Promise<AttendanceRecord[]> {
    await delay(100, 200);
    return db.attendance
      .filter((r) => r.classId === classId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveAttendance(
    classId: string,
    date: string,
    entries: AttendanceEntry[]
  ): Promise<AttendanceRecord> {
    await delay(180, 320);

    const existingIndex = db.attendance.findIndex(
      (r) => r.classId === classId && r.date === date
    );

    let record: AttendanceRecord;

    if (existingIndex !== -1) {
      record = {
        ...db.attendance[existingIndex],
        entries,
      };
      db.attendance[existingIndex] = record;
    } else {
      record = {
        id: `att-rec-${Date.now()}`,
        classId,
        date,
        entries,
      };
      db.attendance.unshift(record);
    }

    return { ...record };
  },

  async getStudentAttendance(classId: string, studentId: string): Promise<StudentAttendanceSummary> {
    await delay(100, 200);

    const classRecords = db.attendance
      .filter((r) => r.classId === classId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const history: { date: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[] = [];

    for (const record of classRecords) {
      const entry = record.entries.find((e) => e.studentId === studentId);
      if (entry) {
        history.push({ date: record.date, status: entry.status });
        if (entry.status === 'PRESENT') {
          presentCount++;
        } else if (entry.status === 'ABSENT') {
          absentCount++;
        } else if (entry.status === 'LATE') {
          lateCount++;
        }
      }
    }

    const totalSessions = history.length;
    // Standard attendance percentage: (Present + Late) / Total
    const effectivePresent = presentCount + lateCount;
    const percentage = totalSessions > 0 ? Math.round((effectivePresent / totalSessions) * 100) : 100;

    return {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      percentage,
      history,
    };
  },

  async getClassAttendanceOverview(classId: string): Promise<ClassAttendanceOverview> {
    await delay(120, 250);

    const cls = db.classes.find((c) => c.id === classId);
    if (!cls) {
      return { totalSessions: 0, averagePercentage: 0, studentSummaries: [] };
    }

    const classRecords = db.attendance.filter((r) => r.classId === classId);
    const totalSessions = classRecords.length;
    const students = db.users.filter((u) => cls.studentIds.includes(u.id));

    let overallPercentagesSum = 0;

    const studentSummaries = students.map((student) => {
      let presentCount = 0;
      let absentCount = 0;
      let evaluatedCount = 0;

      for (const record of classRecords) {
        const entry = record.entries.find((e) => e.studentId === student.id);
        if (entry) {
          evaluatedCount++;
          if (entry.status === 'PRESENT' || entry.status === 'LATE') {
            presentCount++;
          } else {
            absentCount++;
          }
        }
      }

      const percentage = evaluatedCount > 0 ? Math.round((presentCount / evaluatedCount) * 100) : 100;
      overallPercentagesSum += percentage;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        presentCount,
        absentCount,
        totalSessions: evaluatedCount,
        percentage,
      };
    });

    const averagePercentage =
      students.length > 0 ? Math.round(overallPercentagesSum / students.length) : 0;

    return {
      totalSessions,
      averagePercentage,
      studentSummaries,
    };
  },
};
