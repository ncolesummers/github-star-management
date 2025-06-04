# Agile Workflow Guide

This document outlines our agile workflow process for the GitHub Star Management project.

## Agile Methodology

We follow a simplified Scrum approach with elements of Kanban for our development process. This provides structure while maintaining flexibility for our open-source project.

## Sprints

- **Sprint Length**: 2 weeks
- **Sprint Planning**: First day of sprint
- **Sprint Review/Retrospective**: Last day of sprint
- **Daily Stand-ups**: Asynchronous updates in the project discussion board

## Roles

- **Product Owner**: Maintains the product backlog and prioritizes features
- **Scrum Master**: Facilitates the process and removes impediments
- **Development Team**: Implements the features and fixes

## Workflow Stages

Our workflow follows these stages, represented as columns in our GitHub project board:

1. **Backlog**: All issues that have been created but not yet planned for a sprint
2. **Ready**: Issues that have been refined and are ready to be worked on
3. **In Progress**: Issues currently being worked on
4. **Review**: Code is completed and under review
5. **Done**: Issues that have been completed and merged

## Issue Flow

### 1. Backlog Creation and Refinement

- **Features** are created to represent major functionality
- **User Stories** are created and linked to features
- The product owner and team refine these regularly:
  - Adding acceptance criteria
  - Estimating story points
  - Clarifying requirements
  - Breaking down large stories

### 2. Sprint Planning

- Stories are selected from the "Ready" column for the sprint
- **Tasks** are created for technical implementation work
- Tasks are assigned to team members

### 3. Implementation

- Team members work on assigned tasks
- When starting work, move the issue to "In Progress"
- Create a branch using the naming convention:
  - `feature/issue-number-short-description`
  - `fix/issue-number-short-description`
- Make incremental commits following our [Commit Guidelines](../../../CONTRIBUTING.md#commit-guidelines)

### 4. Code Review

- Create a Pull Request when the task is ready for review
- Link the PR to the issue with "Fixes #123" or "Resolves #123"
- Request reviews from team members
- Move the issue to "Review"
- Address feedback and make necessary changes

### 5. Completion

- Once approved, the PR can be merged
- Move the issue to "Done"
- Update any parent user stories or features if all related tasks are complete

## Definition of Ready

A user story is considered "Ready" when:

- It follows the "As a [role], I want [capability] so that [benefit]" format
- It has clear, testable acceptance criteria
- It has been estimated (story points)
- It has been prioritized
- It is small enough to be completed in a single sprint
- Dependencies have been identified

## Definition of Done

A task/story is considered "Done" when:

- All acceptance criteria have been met
- Code has been reviewed and approved
- Tests have been written and pass
- Documentation has been updated
- The code has been merged to the main branch

## Estimating Work

- **Features**: Sized as Small (1-3 days), Medium (3-7 days), or Large (7+ days)
- **User Stories**: Estimated using story points (1, 2, 3, 5, 8, 13)
- **Tasks**: Estimated in hours (1h, 2-4h, 4-8h, 1+ days)

## Metrics and Reporting

We track the following metrics:

- Velocity (story points completed per sprint)
- Cycle time (time from "In Progress" to "Done")
- Bug rate (number of bugs reported per feature)

## Adapting the Process

This process is not set in stone. We encourage team members to suggest improvements during sprint retrospectives. Our goal is to maintain a process that:

- Supports quality code development
- Provides visibility into project progress
- Minimizes overhead for contributors
- Adapts to the team's needs over time

## Tools

- **Issue Tracking**: GitHub Issues with templates
- **Project Management**: GitHub Projects
- **Documentation**: Markdown files in the repository
- **Communication**: GitHub Discussions and Issues