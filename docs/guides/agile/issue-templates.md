# Issue Templates Guide

This document explains how to use the project's issue templates within our agile development workflow.

## Overview

We use three types of issue templates to organize our work:

1. **Features** - Larger units of work that deliver significant value
2. **User Stories** - Requirements written from a user's perspective
3. **Tasks** - Specific technical activities needed to implement features or stories

## Agile Hierarchy

Our issues follow a hierarchical structure:

```
Feature
├── User Story 1
│   ├── Task 1.1
│   └── Task 1.2
└── User Story 2
    ├── Task 2.1
    └── Task 2.2
```

## Using the Templates

### Feature Requests

Use the **Feature Request** template when proposing substantial new functionality. Features:

- Represent significant additions to the project
- Often span multiple user stories
- Are sized based on complexity (Small, Medium, Large)
- Include clear acceptance criteria

When creating a feature:
1. Use the title format: `feat: [Feature Name]`
2. Fill in all required fields, especially acceptance criteria
3. Add appropriate labels (beyond the automatic ones)
4. Link related user stories as they are created

### User Stories

Use the **User Story** template to capture requirements from a user's perspective. User stories:

- Follow the format: "As a [role], I want [capability] so that [benefit]"
- Are estimated using story points (1, 2, 3, 5, 8, 13)
- Must have clear acceptance criteria
- Should be independent and negotiable
- Link to their parent feature

When creating a user story:
1. Use the title format provided in the template
2. Ensure the story is properly sized
3. Check that all acceptance criteria are testable
4. Link to the parent feature using `Relates to #[feature-number]` in the description

### Tasks

Use the **Task** template for specific technical work items. Tasks:

- Represent concrete implementation activities
- Are typically assigned to a single developer
- Have time-based estimates (hours/days)
- Include specific technical details
- Link to their parent user story

When creating a task:
1. Use the title format: `task: [Brief Task Description]`
2. Link to the parent user story
3. Provide detailed technical information
4. Break down implementation into clear steps

## Workflow

1. **Backlog Refinement**
   - Features and user stories are created and refined
   - Acceptance criteria and estimates are added
   - Stories are prioritized

2. **Sprint Planning**
   - User stories are selected for the sprint
   - Tasks are created for selected stories
   - Work is assigned to team members

3. **Implementation**
   - Tasks are moved through the workflow (To Do → In Progress → Review → Done)
   - Code is submitted via pull requests linked to tasks
   - Tasks are marked complete when all acceptance criteria are met

4. **Review**
   - When all tasks for a user story are complete, the story is reviewed
   - When all stories for a feature are complete, the feature is reviewed

## Tips for Effective Usage

- **Link Issues**: Always connect tasks to stories and stories to features
- **Use Checklists**: Update acceptance criteria checkboxes as work progresses
- **Provide Context**: Include enough detail for others to understand the work
- **Update Estimates**: Refine time/effort estimates as you learn more
- **Close Completed Work**: Mark issues as closed when all criteria are met

## Labels

We use the following labels to organize our issues:

- `enhancement`: New features or improvements
- `feature`: Major new functionality
- `user-story`: User-focused requirements
- `task`: Technical implementation work
- `documentation`: Documentation updates
- `bug`: Something isn't working as expected
- `priority-high`: High priority items
- `priority-medium`: Medium priority items
- `priority-low`: Low priority items

## Further Reading

For more information on our agile processes, see:
- [Agile Workflow Guide](./workflow.md)
- [Sprint Planning Guide](./sprint-planning.md)
- [Definition of Done](./definition-of-done.md)