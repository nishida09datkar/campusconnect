package com.campusconnect.dto;

import com.campusconnect.dto.user.UserDto;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class UserDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("UserDto maps User fields without exposing password hash")
    void testUserDtoExcludesPassword() throws Exception {
        User user = new User("user-1", "test@campus.test", "$2a$10$SecretPasswordHash12345", "Test User", Role.STUDENT, "dept-ce");
        UserDto dto = UserDto.from(user);

        assertNotNull(dto);
        assertEquals("user-1", dto.getId());
        assertEquals("test@campus.test", dto.getEmail());
        assertEquals("Test User", dto.getName());
        assertEquals(Role.STUDENT, dto.getRole());
        assertEquals("dept-ce", dto.getDepartmentId());

        String json = objectMapper.writeValueAsString(dto);
        assertFalse(json.contains("SecretPasswordHash"), "UserDto JSON must NEVER contain password hash");
        assertFalse(json.contains("password"), "UserDto JSON must not contain password field");
    }

    @Test
    @DisplayName("User entity JSON serialization respects @JsonIgnore on password")
    void testUserEntityJsonIgnoresPassword() throws Exception {
        User user = new User("user-2", "faculty@campus.test", "$2a$10$AnotherSuperSecretHash", "Prof. Faculty", Role.FACULTY, "dept-ce");
        String json = objectMapper.writeValueAsString(user);

        assertFalse(json.contains("AnotherSuperSecretHash"), "User entity JSON must ignore password field");
        assertFalse(json.contains("password"), "Serialized user JSON must not expose password");
    }
}
