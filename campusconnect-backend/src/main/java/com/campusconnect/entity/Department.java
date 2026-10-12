package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "hod_id", length = 64)
    private String hodId;

    public Department() {}

    public Department(String id, String name, String code, String hodId) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.hodId = hodId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getHodId() { return hodId; }
    public void setHodId(String hodId) { this.hodId = hodId; }
}
