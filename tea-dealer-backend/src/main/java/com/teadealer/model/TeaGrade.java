package com.teadealer.model;

public enum TeaGrade {
    GRADE_1("Grade 1"),
    GRADE_2("Grade 2");

    private final String displayName;

    TeaGrade(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
