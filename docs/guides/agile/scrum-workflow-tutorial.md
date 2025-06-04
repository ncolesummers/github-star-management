# Scrum Workflow Tutorial with Claude Code

This tutorial explains how to use Claude Code's custom slash commands to implement a complete Scrum workflow for feature development in the GitHub Star Management project.

## Overview

Claude Code provides specialized roles and workflows that help you implement agile Scrum practices effectively. This tutorial walks you through the process of:

1. Creating a feature using the Product Owner role
2. Breaking down the feature into user stories and tasks with the refinement workflow
3. Creating an implementation plan with the implementation-plan workflow

## Prerequisites

- Claude Code CLI installed and configured
- Access to the GitHub Star Management repository
- Basic understanding of Scrum and agile methodologies

## Step 1: Create a Feature with the Product Owner Role

The first step is to create a well-defined feature using the Product Owner role. This ensures the feature has clear business value and acceptance criteria.

```bash
claude > /project:roles:product-owner "Add a star analytics dashboard that provides visualizations and metrics about the user's starred repositories, including language distribution, topic clusters, and activity trends."
```

The Product Owner role will help you:
- Define the feature scope and objectives
- Identify business value and user benefits
- Establish comprehensive acceptance criteria
- Create a properly formatted feature request

The output will be a complete feature request that follows our template, ready to be submitted as a GitHub issue.

## Step 2: Refine the Feature into Stories and Tasks

Once you have a well-defined feature, use the refinement workflow to break it down into user stories and tasks:

```bash
claude > /project:workflows:refinement "Feature: Add a star analytics dashboard that provides visualizations and metrics about the user's starred repositories, including language distribution, topic clusters, and activity trends."
```

The refinement workflow will:
- Analyze the feature requirements
- Create user stories in the correct format with acceptance criteria
- Decompose stories into specific technical tasks
- Establish relationships between the feature, stories, and tasks
- Prioritize and sequence the work

The output will include GitHub issue-ready content for each user story and task, with proper linking between them.

## Step 3: Create an Implementation Plan

After refining the feature into stories and tasks, use the implementation-plan workflow to create a detailed roadmap for completing the work:

```bash
claude > /project:workflows:implementation-plan "Feature: Star Analytics Dashboard"
```

The implementation plan workflow will:
- Analyze the feature, stories, and tasks
- Match tasks with appropriate roles and workflows
- Create a step-by-step plan for implementing each task
- Recommend specific slash commands to use for each step
- Identify potential challenges and solutions
- Suggest testing strategies for each component

The resulting implementation plan provides a comprehensive guide for developers to efficiently complete the feature.

## Example Workflow

Here's a complete example of using these commands for a new feature:

1. **Create Feature (Product Owner)**
   ```
   /project:roles:product-owner "Add bulk star management that allows users to perform actions like categorizing, tagging, or unstarring multiple repositories at once through a selection interface."
   ```

2. **Refine Feature (Refinement Workflow)**
   ```
   /project:workflows:refinement "Feature: Add bulk star management that allows users to perform actions like categorizing, tagging, or unstarring multiple repositories at once through a selection interface."
   ```

3. **Create Implementation Plan**
   ```
   /project:workflows:implementation-plan "Feature: Bulk Star Management"
   ```

4. **Implement with Recommended Commands**
   Follow the specific commands suggested in the implementation plan, such as:
   ```
   /project:roles:deno-api-specialist "Implement the bulk unstar method in the GitHub client"
   ```

## Tips for Effective Usage

- Be as specific as possible when describing features
- Review and refine the outputs from each step before proceeding
- Create GitHub issues from the generated content, maintaining the proper hierarchy
- Use the suggested slash commands in the implementation plan for consistent results
- Customize the implementation plan based on team member availability and expertise

## Additional Resources

- [Issue Templates Guide](./issue-templates.md)
- [Agile Workflow Guide](./workflow.md)
- [Definition of Done](./definition-of-done.md)
- [Scrum Roles and Responsibilities](./scrum-roles.md)