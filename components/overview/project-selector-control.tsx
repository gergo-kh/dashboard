"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { buildOverviewProjectHref } from "@/lib/overview/project-selection";
import type { ProjectSelectorItem } from "@/types/overview";

type ProjectSelectorControlProps = Readonly<{
  canSwitchProjects: boolean;
  helpText: string;
  projects: ProjectSelectorItem[];
}>;

export function ProjectSelectorControl({
  canSwitchProjects,
  helpText,
  projects
}: ProjectSelectorControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProject = projects.find((project) => project.isSelected) ?? projects[0];
  const isDisabled = !canSwitchProjects;

  function handleProjectChange(event: ChangeEvent<HTMLSelectElement>) {
    const requestedProject = projects.find(
      (project) => project.id === event.target.value && project.isAccessible
    );

    if (!requestedProject) {
      return;
    }

    router.push(
      buildOverviewProjectHref({
        pathname,
        searchParams: new URLSearchParams(searchParams.toString()),
        projectId: requestedProject.id
      })
    );
  }

  return (
    <label className="kh-control-field">
      Projekt
      <select
        aria-describedby="project-selector-help"
        aria-label="Projekt kiválasztása"
        disabled={isDisabled}
        onChange={handleProjectChange}
        value={selectedProject?.id ?? ""}
      >
        {projects.map((project) => (
          <option disabled={!project.isAccessible} key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <span className="kh-control-help" id="project-selector-help">
        {helpText}
      </span>
    </label>
  );
}
