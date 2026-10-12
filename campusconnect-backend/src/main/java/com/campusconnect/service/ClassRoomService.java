package com.campusconnect.service;

import com.campusconnect.dto.academic.ClassMembersResponse;
import com.campusconnect.dto.academic.ClassResponse;
import com.campusconnect.dto.academic.CourseResponse;
import com.campusconnect.dto.academic.CreateClassRequest;
import com.campusconnect.entity.ClassRoom;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.User;
import com.campusconnect.repository.ClassRoomRepository;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public ClassRoomService(ClassRoomRepository classRoomRepository,
                            EnrollmentRepository enrollmentRepository,
                            CourseRepository courseRepository,
                            UserRepository userRepository) {
        this.classRoomRepository = classRoomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    public List<ClassResponse> getClasses(String facultyId, String studentId) {
        List<ClassRoom> classes;
        if (facultyId != null && !facultyId.trim().isEmpty()) {
            classes = classRoomRepository.findByFacultyId(facultyId.trim());
        } else if (studentId != null && !studentId.trim().isEmpty()) {
            List<String> classIds = enrollmentRepository.findByStudentId(studentId.trim()).stream()
                    .map(Enrollment::getClassId)
                    .collect(Collectors.toList());
            classes = classRoomRepository.findByIdIn(classIds);
        } else {
            classes = classRoomRepository.findAll();
        }
        return classes.stream().map(this::enrich).collect(Collectors.toList());
    }

    public ClassResponse getClassById(String id) {
        ClassRoom c = classRoomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));
        return enrich(c);
    }

    public ClassMembersResponse getClassMembers(String classId) {
        ClassRoom c = classRoomRepository.findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));

        User faculty = userRepository.findById(c.getFacultyId()).orElse(null);
        List<String> studentIds = enrollmentRepository.findByClassId(classId).stream()
                .map(Enrollment::getStudentId)
                .collect(Collectors.toList());
        List<User> students = userRepository.findAllById(studentIds);

        return new ClassMembersResponse(faculty, students);
    }

    @Transactional
    public ClassResponse createClass(String facultyId, CreateClassRequest req) {
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class title is required");
        }
        if (req.getSection() == null || req.getSection().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section is required");
        }
        if (req.getCourseId() == null || req.getCourseId().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course ID is required");
        }

        String classCode = req.getClassCode();
        if (classCode == null || classCode.trim().isEmpty()) {
            classCode = "CC" + (1000 + new Random().nextInt(9000));
        } else {
            classCode = classCode.trim().toUpperCase();
        }

        if (classRoomRepository.existsByClassCodeIgnoreCase(classCode)) {
            classCode = "CC" + (1000 + new Random().nextInt(9000));
        }

        String id = "class-" + System.currentTimeMillis();
        String coverColor = req.getCoverColor() != null && !req.getCoverColor().trim().isEmpty()
                ? req.getCoverColor().trim()
                : "from-indigo-600 to-purple-600";

        ClassRoom cr = new ClassRoom(id, req.getCourseId(), req.getTitle().trim(), req.getSection().trim(), classCode, facultyId, coverColor);
        classRoomRepository.save(cr);
        return enrich(cr);
    }

    @Transactional
    public ClassResponse joinClassByCode(String studentId, String classCode) {
        if (classCode == null || classCode.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a valid classroom code.");
        }
        String normalized = classCode.trim().toUpperCase();
        ClassRoom c = classRoomRepository.findByClassCodeIgnoreCase(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No classroom found with code \"" + classCode + "\". Please check with your instructor."));

        if (enrollmentRepository.existsByClassIdAndStudentId(c.getId(), studentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You are already enrolled in this class (" + c.getTitle() + ").");
        }

        Enrollment enrollment = new Enrollment("enr-" + System.currentTimeMillis(), studentId, c.getId());
        enrollmentRepository.save(enrollment);

        return enrich(c);
    }

    public ClassResponse enrich(ClassRoom c) {
        CourseResponse courseResp = null;
        if (c.getCourseId() != null) {
            Course course = courseRepository.findById(c.getCourseId()).orElse(null);
            if (course != null) {
                courseResp = new CourseResponse(course.getId(), course.getCode(), course.getTitle(), course.getDepartmentId(), course.getYear());
            }
        }

        User faculty = null;
        if (c.getFacultyId() != null) {
            faculty = userRepository.findById(c.getFacultyId()).orElse(null);
        }

        List<String> studentIds = enrollmentRepository.findByClassId(c.getId()).stream()
                .map(Enrollment::getStudentId)
                .collect(Collectors.toList());

        return new ClassResponse(
                c.getId(),
                c.getCourseId(),
                c.getTitle(),
                c.getSection(),
                c.getClassCode(),
                c.getFacultyId(),
                studentIds,
                c.getCoverColor(),
                studentIds.size(),
                courseResp,
                faculty
        );
    }
}
