# Test Role-Based Commands Setup

Validate that all role-based slash commands are properly configured and functional.

**Test Context**: $ARGUMENTS

## Command Structure Validation

### 1. Directory Structure Check
Verify that all command directories exist:
- `.claude/commands/roles/` - Individual role commands
- `.claude/commands/chains/` - Sequential workflow commands
- `.claude/commands/parallel/` - Simultaneous analysis commands
- `.claude/commands/workflows/` - Utility workflow commands
- `.claude/commands/quick/` - Quick action commands

### 2. Role Commands Test
List and test individual role commands:
- `/project:roles:product-manager`
- `/project:roles:senior-frontend-architect`
- `/project:roles:typescript-quality-engineer`
- `/project:roles:senior-sdet`
- `/project:roles:cybersecurity-engineer`
- `/project:roles:devops-engineer`
- `/project:roles:ui-ux-design-engineer`
- `/project:roles:open-source-maintainer`

### 3. Chain Commands Test
Validate sequential workflow commands:
- `/project:chains:feature-development`
- `/project:chains:bug-fix-optimization`
- `/project:chains:security-review`

### 4. Parallel Commands Test
Test simultaneous analysis commands:
- `/project:parallel:code-review-team`
- `/project:parallel:feature-planning-team`
- `/project:parallel:performance-team`

### 5. Workflow Utilities Test
Validate utility commands:
- `/project:workflows:analyze-task`
- `/project:workflows:handoff-context`
- `/project:workflows:synthesize-perspectives`

### 6. Quick Actions Test
Test rapid response commands:
- `/project:quick:review-pr`
- `/project:quick:fix-bug`
- `/project:quick:optimize-performance`
- `/project:quick:security-check`

## Functionality Tests

### Test 1: Single Role Functionality
Demo a single role command with the test context provided.

### Test 2: Role Switching
Demonstrate switching between two different roles and show context preservation.

### Test 3: Command Discovery
Show how to list available commands and explain their usage patterns.

### Test 4: Argument Handling
Validate that $ARGUMENTS variable works correctly across different command types.

## Expected Outcomes
- All commands are discoverable and accessible
- Role switching maintains appropriate context
- Arguments are properly passed and utilized
- Each command produces role-appropriate analysis
- Command structure is intuitive and well-organized

Provide a comprehensive test report with any issues found and recommendations for improvements.