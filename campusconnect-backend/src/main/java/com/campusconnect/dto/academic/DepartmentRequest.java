package com.campusconnect.dto.academic;

public class DepartmentRequest {
    private String name;
    private String code;
    private String hodId;

    public DepartmentRequest() {}

    public DepartmentRequest(String name, String code, String hodId) {
        this.name = name;
        this.code = code;
        this.hodId = hodId;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getHodId() { return hodId; }
    public void setHodId(String hodId) { this.hodId = hodId; }
}
