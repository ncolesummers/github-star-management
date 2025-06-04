# Implementation Plan Workflow

This workflow creates a detailed implementation plan for a feature, recommending specific
roles and workflows to use for each component of the work.

## Workflow Steps

1. **Gather Feature Information**

   - Identify the feature and its requirements
   - Locate associated user stories and tasks
   - Review acceptance criteria for all issues
   - Understand technical constraints and dependencies
   - Assess overall complexity and scope

2. **Analyze Available Resources**

   - Review available project roles and their expertise areas
   - Identify relevant workflows for different implementation aspects
   - Consider the project's technical architecture and patterns
   - Evaluate testing requirements and strategies
   - Identify documentation needs

3. **Create Implementation Sequence**

   - Determine the logical order for implementing components
   - Account for technical dependencies between tasks
   - Group related tasks that should be implemented together
   - Consider risk mitigation in sequencing decisions
   - Create a step-by-step implementation path

4. **Match Tasks with Roles and Workflows**

   - Identify the most appropriate role for each task
   - Recommend specific workflows for complex implementations
   - Create command suggestions with arguments
   - Provide rationale for role and workflow selections
   - Include expected outcomes for each step

5. **Define Testing Strategy**

   - Recommend appropriate testing approaches for each component
   - Suggest test-driven development where appropriate
   - Identify areas requiring integration testing
   - Outline performance testing needs
   - Create verification steps for acceptance criteria

6. **Document Completion Requirements**
   - Create comprehensive definition of done criteria
   - Outline documentation requirements
   - Specify review processes
   - Identify deployment considerations
   - Detail verification procedures

## Available Roles

The project includes the following specialized roles that can be used in your implementation plan:

- `/project:roles:product-owner` - Defines features and user stories with business value
- `/project:roles:scrum-master` - Facilitates agile processes and removes impediments
- `/project:roles:development-team` - Implements features with Deno TypeScript
- `/project:roles:deno-api-specialist` - Expertise in Deno APIs and patterns
- `/project:roles:deno-github-api-specialist` - Specializes in GitHub API integration
- `/project:roles:deno-testing-specialist` - Expert in testing Deno applications
- `/project:roles:cli-specialist` - Specializes in command-line interfaces
- `/project:roles:star-management-cli-specialist` - Expert in star management CLI
- `/project:roles:star-management-specialist` - Deep knowledge of star management domain
- `/project:roles:test-driven-development-specialist` - TDD expertise
- `/project:roles:devops-specialist` - Deployment and automation expert
- `/project:roles:open-source-maintainer` - Expert in open source project maintenance
- `/project:roles:research-assistant` - Assists with research and documentation. Great for performing spike research tasks.

## Available Workflows

The project includes these workflows to assist with implementation:

- `/project:workflows:refinement` - Breaks down features into stories and tasks
- `/project:workflows:add-cli-command` - Creates new CLI commands
- `/project:workflows:generate-documentation` - Creates or updates documentation
- `/project:workflows:implement-api-feature` - Implements GitHub API features
- `/project:workflows:implement-tests` - Creates test suites
- `/project:workflows:shell-to-deno-migration` - Migrates shell scripts to Deno
- `/project:workflows:test-driven-feature` - Implements features using TDD
- `/project:workflows:test-first-api-client` - Develops API clients with TDD

## Example: Star Categorization Feature Implementation Plan

```markdown
# Implementation Plan: Automated Star Categorization

## Feature Overview

Automatically categorize GitHub stars based on repository metadata including topics,
description, and README content.

## Related Issues

- Feature: #42 - Automated Star Categorization
- User Stories:
  - #43 - Topic-Based Categorization
  - #44 - Description-Based Categorization
- Tasks:
  - #45 - Implement Topic Fetching
  - #46 - Create Categorization Service
  - #47 - Implement CLI Command

## Implementation Sequence

1. Implement Topic Fetching API Client (#45)
2. Create Categorization Service (#46)
3. Implement CLI Command (#47)
4. Add Integration Tests
5. Update Documentation

## Recommended Roles and Workflows

### Step 1: Implement Topic Fetching API Client

- Role: `/project:roles:deno-github-api-specialist`
- Workflow: `/project:workflows:test-first-api-client`
- Command Arguments: "Implement GitHub repository topic fetching with pagination and rate limiting"
- Expected Outcome: API client methods for fetching repository topics with tests

### Step 2: Create Categorization Service

- Role: `/project:roles:star-management-specialist`
- Workflow: `/project:workflows:test-driven-feature`
- Command Arguments: "Create a service that maps GitHub topics to predefined categories with confidence scores"
- Expected Outcome: Categorization service with algorithms and tests

### Step 3: Implement CLI Command

- Role: `/project:roles:star-management-cli-specialist`
- Workflow: `/project:workflows:add-cli-command`
- Command Arguments: "Add categorize command with options for output format and filtering"
- Expected Outcome: CLI command for categorization with documentation

### Step 4: Add Integration Tests

- Role: `/project:roles:deno-testing-specialist`
- Workflow: `/project:workflows:implement-tests`
- Command Arguments: "Create integration tests for the complete categorization workflow"
- Expected Outcome: Integration tests verifying end-to-end functionality

### Step 5: Update Documentation

- Role: `/project:roles:open-source-maintainer`
- Workflow: `/project:workflows:generate-documentation`
- Command Arguments: "Create documentation for the star categorization feature"
- Expected Outcome: Updated README and specific documentation for the feature

## Technical Considerations

- Ensure proper rate limit handling for GitHub API
- Consider performance optimization for large star collections
- Implement caching to minimize API calls
- Use consistent category mapping algorithms

## Testing Strategy

- Unit tests for API client with mock responses
- Unit tests for categorization algorithms
- Integration tests for end-to-end functionality
- Performance tests with large repository collections

## Documentation Needs

- Update README with new command
- Add detailed documentation for categorization algorithms
- Include examples of category mapping
- Document configuration options

## Definition of Done

- All unit and integration tests passing
- CLI command properly documented
- Performance benchmarks meeting targets
- Code reviewed and approved by at least one team member
- Documentation updated and verified
```
