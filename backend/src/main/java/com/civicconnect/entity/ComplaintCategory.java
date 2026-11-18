package com.civicconnect.entity;

/**
 * Enumeration representing the supported categories of civic complaints.
 * Each category has a designated base priority weight used in the triage formula.
 */
public enum ComplaintCategory {
    POTHOLE(3.5, "Pothole / Road Damage"),
    GARBAGE(3.0, "Garbage / Waste Overflow"),
    WATER_LEAK(4.5, "Water Pipeline Leakage / Flooding"),
    STREETLIGHT(2.5, "Streetlight Outage / Electrical Hazard");

    private final double baseWeight;
    private final String displayName;

    ComplaintCategory(double baseWeight, String displayName) {
        this.baseWeight = baseWeight;
        this.displayName = displayName;
    }

    public double getBaseWeight() {
        return baseWeight;
    }

    public String getDisplayName() {
        return displayName;
    }
}
