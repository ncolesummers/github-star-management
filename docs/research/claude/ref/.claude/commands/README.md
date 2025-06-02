# Role-Based Slash Commands for Claude Code

This directory contains custom slash commands that transform Claude into specialized expert roles for multi-perspective software development analysis.

## Quick Start

### Analyze a Task
```bash
/project:workflows:analyze-task "Implement OAuth2 authentication with role-based permissions"
```

### Single Role Analysis
```bash
/project:roles:senior-frontend-architect "Review the new dashboard component architecture"
```

### Sequential Expert Chain
```bash
/project:chains:feature-development "Create a real-time notification system"
```

### Parallel Expert Analysis
```bash
/project:parallel:code-review-team "PR #123 - Authentication refactor"
```

## Command Categories

### 🎭 Individual Roles (`/project:roles:`)
Specialized expert perspectives for focused analysis:
- `product-manager` - Business requirements and strategy
- `senior-frontend-architect` - Technical architecture and design
- `typescript-quality-engineer` - Code quality and type safety
- `senior-sdet` - Testing strategy and quality assurance
- `cybersecurity-engineer` - Security assessment and compliance
- `devops-engineer` - Infrastructure and deployment
- `ui-ux-design-engineer` - User experience and accessibility
- `open-source-maintainer` - Community and sustainability

### 🔗 Sequential Chains (`/project:chains:`)
Multi-role workflows that build upon each phase:
- `feature-development` - Complete feature development lifecycle
- `bug-fix-optimization` - Comprehensive bug analysis and resolution
- `security-review` - Multi-layered security assessment

### ⚡ Parallel Analysis (`/project:parallel:`)
Simultaneous expert perspectives with synthesis:
- `code-review-team` - Multi-expert code review
- `feature-planning-team` - Comprehensive feature planning
- `performance-team` - Performance optimization analysis

### 🛠️ Workflow Utilities (`/project:workflows:`)
Supporting tools for complex workflows:
- `analyze-task` - Determine optimal workflow strategy
- `handoff-context` - Preserve context between roles
- `synthesize-perspectives` - Unify multi-role insights

### ⚡ Quick Actions (`/project:quick:`)
Rapid, focused expert responses:
- `review-pr` - Fast TypeScript-focused PR review
- `fix-bug` - Quick bug analysis and resolution
- `optimize-performance` - Immediate performance improvements
- `security-check` - Rapid security assessment

## Usage Patterns

### Pattern 1: Task Complexity Analysis
Start with complexity analysis to choose the right approach:
```bash
/project:workflows:analyze-task "Your complex development task"
# Follow the recommended workflow from the analysis
```

### Pattern 2: Single Expert Consultation
For focused, domain-specific analysis:
```bash
/project:roles:cybersecurity-engineer "Review authentication implementation"
```

### Pattern 3: Sequential Expert Chain
For comprehensive feature development:
```bash
/project:chains:feature-development "Build user analytics dashboard"
# Automatically progresses through Product → Architecture → Quality → Testing
```

### Pattern 4: Parallel Expert Team
For complex decisions requiring multiple perspectives:
```bash
/project:parallel:code-review-team "Major refactoring PR"
# Gets simultaneous input from Architecture, Quality, and Security experts
```

### Pattern 5: Context Handoff
For manual role transitions:
```bash
/project:roles:product-manager "Define user requirements"
# Then use the output as input to:
/project:workflows:handoff-context "[Product Manager's analysis]"
# Finally:
/project:roles:senior-frontend-architect "[Handoff context + original task]"
```

## Command Composition Examples

### Example 1: Feature Development
```bash
# Step 1: Analyze complexity
/project:workflows:analyze-task "Real-time collaboration features"

# Step 2: Follow recommended approach (e.g., sequential chain)
/project:chains:feature-development "Real-time collaboration features"

# Step 3: If conflicts arise, synthesize
/project:workflows:synthesize-perspectives "[Chain output]"
```

### Example 2: Bug Investigation
```bash
# Quick assessment
/project:quick:fix-bug "Memory leak in dashboard component"

# If complex, escalate to full analysis
/project:chains:bug-fix-optimization "Memory leak in dashboard component"
```

### Example 3: Code Review
```bash
# Quick review
/project:quick:review-pr "Authentication service changes"

# For critical changes, get team perspective
/project:parallel:code-review-team "Authentication service changes"
```

## Best Practices

1. **Start with Analysis**: Use `/project:workflows:analyze-task` for complex or unfamiliar tasks
2. **Choose Appropriate Scope**: Single role for focused issues, chains for comprehensive development, parallel for critical decisions
3. **Preserve Context**: Use handoff commands when manually transitioning between roles
4. **Synthesize Conflicts**: Use synthesis commands when parallel analyses conflict
5. **Document Decisions**: Keep role outputs for future reference and team alignment

## Integration with Development Workflow

### Git Integration
```bash
# Before starting work
/project:workflows:analyze-task "$(git show --name-only HEAD)"

# During development
/project:quick:review-pr "$(git diff --name-only main...HEAD)"

# Before merging
/project:parallel:code-review-team "$(git log --oneline main...HEAD)"
```

### CI/CD Integration
Use commands in pull request templates or automated checks:
```markdown
## Pre-merge Checklist
- [ ] `/project:quick:security-check` completed
- [ ] `/project:quick:optimize-performance` reviewed
- [ ] `/project:parallel:code-review-team` approved
```

## Troubleshooting

### Command Not Found
- Verify `.claude/commands/` directory structure
- Check file naming matches command structure
- Ensure files are in the correct subdirectories

### Poor Role Performance
- Provide more specific context in arguments
- Use handoff commands to preserve context between roles
- Try analyze-task first for complex scenarios

### Conflicting Recommendations
- Use `/project:workflows:synthesize-perspectives`
- Review individual role constraints and assumptions
- Consider parallel analysis for critical decisions

## Contributing

To add new roles or workflows:
1. Follow existing file naming patterns
2. Include clear role definitions and responsibilities
3. Use `$ARGUMENTS` for dynamic input
4. Provide structured output templates
5. Test with various input scenarios

---

**Next Steps**: Run `/project:test-setup "Initial validation"` to verify your command setup.