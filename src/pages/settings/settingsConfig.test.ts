import { describe, expect, it } from "vitest";
import {
  settingsDefinitions,
  settingsNavigationGroups,
  unsupportedSettingsSlugs,
} from "./settingsConfig";

describe("settings configuration registry", () => {
  it("only exposes backend-supported system configuration pages", () => {
    const exposedSlugs = settingsDefinitions.map((definition) => definition.slug);

    expect(exposedSlugs).toEqual([
      "departments",
      "designations",
      "employment-types",
      "job-statuses",
      "work-modes",
      "work-locations",
      "shifts",
      "leave-types",
      "leave-policies",
      "leave-capacity",
      "allowance-types",
      "penalty-rules",
      "roles",
    ]);

    for (const unsupportedSlug of unsupportedSettingsSlugs) {
      expect(exposedSlugs).not.toContain(unsupportedSlug);
    }
  });

  it("keeps sidebar navigation grouped in product-friendly sections", () => {
    expect(settingsNavigationGroups.map((group) => group.label)).toEqual([
      "Organization Structure",
      "Employment Parameters",
      "Leave Management",
      "Finance & Compliance",
      "Access Control",
    ]);

    expect(settingsNavigationGroups.flatMap((group) => group.links)).toContainEqual({
      to: "/settings/allowance-types",
      label: "Allowance Types",
    });
    expect(settingsNavigationGroups.flatMap((group) => group.links)).toContainEqual({
      to: "/settings/penalty-rules",
      label: "Penalty Rules",
    });
  });
});
