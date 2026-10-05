import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { ClassRoom, Course, User, StreamPost, Reply, Attachment } from '@/types';

export interface EnrichedClassRoom extends ClassRoom {
  course?: Course;
  faculty?: User;
  studentsCount: number;
}

export const classroomService = {
  async getFacultyClasses(facultyId: string): Promise<EnrichedClassRoom[]> {
    await delay(120, 240);
    const classes = db.classes.filter((c) => c.facultyId === facultyId);
    return classes.map((c) => {
      const course = db.courses.find((course) => course.id === c.courseId);
      const faculty = db.users.find((u) => u.id === c.facultyId);
      return {
        ...c,
        course,
        faculty,
        studentsCount: c.studentIds.length,
      };
    });
  },

  async getStudentClasses(studentId: string): Promise<EnrichedClassRoom[]> {
    await delay(120, 240);
    const classes = db.classes.filter((c) => c.studentIds.includes(studentId));
    return classes.map((c) => {
      const course = db.courses.find((course) => course.id === c.courseId);
      const faculty = db.users.find((u) => u.id === c.facultyId);
      return {
        ...c,
        course,
        faculty,
        studentsCount: c.studentIds.length,
      };
    });
  },

  async getClassById(classId: string): Promise<EnrichedClassRoom | null> {
    await delay(100, 200);
    const c = db.classes.find((item) => item.id === classId);
    if (!c) return null;
    const course = db.courses.find((course) => course.id === c.courseId);
    const faculty = db.users.find((u) => u.id === c.facultyId);
    return {
      ...c,
      course,
      faculty,
      studentsCount: c.studentIds.length,
    };
  },

  async getClassMembers(classId: string): Promise<{ faculty: User | null; students: User[] }> {
    await delay(100, 200);
    const c = db.classes.find((item) => item.id === classId);
    if (!c) return { faculty: null, students: [] };
    const faculty = db.users.find((u) => u.id === c.facultyId) || null;
    const students = db.users.filter((u) => c.studentIds.includes(u.id));
    return { faculty, students };
  },

  async joinClassByCode(classCode: string, studentId: string): Promise<EnrichedClassRoom> {
    await delay(200, 350);
    const trimmed = classCode.trim();
    if (!trimmed) {
      throw new Error('Please enter a valid classroom code.');
    }
    const normalizedCode = trimmed.toUpperCase();
    const c = db.classes.find((item) => item.classCode.toUpperCase() === normalizedCode);
    if (!c) {
      throw new Error(`No classroom found with code "${classCode}". Please check with your instructor.`);
    }

    if (c.studentIds.includes(studentId)) {
      throw new Error(`You are already enrolled in this class (${c.title}).`);
    }

    c.studentIds.push(studentId);
    // Also record enrollment
    db.enrollments.push({
      id: `enr-${Date.now()}`,
      studentId,
      classId: c.id,
    });

    const course = db.courses.find((course) => course.id === c.courseId);
    const faculty = db.users.find((u) => u.id === c.facultyId);
    return {
      ...c,
      course,
      faculty,
      studentsCount: c.studentIds.length,
    };
  },

  async createClass(
    facultyId: string,
    data: { courseId: string; title: string; section: string; coverColor?: string }
  ): Promise<EnrichedClassRoom> {
    await delay(250, 400);
    const trimmedTitle = data.title.trim();
    const trimmedSection = data.section.trim();
    if (!trimmedTitle) {
      throw new Error('Class title is required.');
    }
    if (!trimmedSection) {
      throw new Error('Section is required.');
    }

    const newClassCode = `CC${Math.floor(1000 + Math.random() * 9000)}`;
    const newClass: ClassRoom = {
      id: `class-${Date.now()}`,
      courseId: data.courseId,
      title: trimmedTitle,
      section: trimmedSection,
      classCode: newClassCode,
      facultyId,
      studentIds: [],
      coverColor: data.coverColor || 'from-indigo-600 to-purple-600',
    };

    db.classes.unshift(newClass);
    const course = db.courses.find((c) => c.id === data.courseId);
    const faculty = db.users.find((u) => u.id === facultyId);

    return {
      ...newClass,
      course,
      faculty,
      studentsCount: 0,
    };
  },

  async getClassStream(classId: string): Promise<(StreamPost & { author?: User })[]> {
    await delay(100, 200);
    const posts = db.streamPosts.filter((p) => p.classId === classId);
    return posts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => ({
        ...p,
        author: db.users.find((u) => u.id === p.authorId),
      }));
  },

  async createStreamPost(
    classId: string,
    authorId: string,
    data: {
      type: 'ANNOUNCEMENT' | 'MATERIAL' | 'DOUBT';
      body: string;
      attachments?: Attachment[];
    }
  ): Promise<StreamPost & { author?: User }> {
    await delay(150, 300);
    const newPost: StreamPost = {
      id: `post-${Date.now()}`,
      classId,
      authorId,
      type: data.type,
      body: data.body.trim(),
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      replies: [],
      resolved: data.type === 'DOUBT' ? false : undefined,
    };

    db.streamPosts.unshift(newPost);
    const author = db.users.find((u) => u.id === authorId);
    return { ...newPost, author };
  },

  async addStreamReply(
    postId: string,
    authorId: string,
    body: string
  ): Promise<Reply & { author?: User }> {
    await delay(120, 240);
    const post = db.streamPosts.find((p) => p.id === postId);
    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    const newReply: Reply = {
      id: `rep-${Date.now()}`,
      authorId,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };

    post.replies.push(newReply);
    const author = db.users.find((u) => u.id === authorId);
    return { ...newReply, author };
  },

  async toggleDoubtResolved(postId: string): Promise<StreamPost> {
    await delay(100, 200);
    const post = db.streamPosts.find((p) => p.id === postId);
    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }
    post.resolved = !post.resolved;
    return { ...post };
  },

  async getAllCourses(): Promise<Course[]> {
    await delay(80, 150);
    return [...db.courses];
  },
};

