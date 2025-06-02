# GitHub Star Management Documentation

Welcome to the documentation for GitHub Star Management, a Deno-based tool for organizing and managing your GitHub stars!

## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Documentation Sections](#documentation-sections)
- [Contributing](#contributing)

## Getting Started

GitHub Star Management helps you organize, backup, and clean up your GitHub stars. This documentation will help you get started with the tool and make the most of its features.

## Installation

Follow these steps to install GitHub Star Management:

1. Make sure you have Deno installed:
   ```bash
   # macOS (Homebrew)
   brew install deno

   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex

   # Linux/macOS (Shell)
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/github-star-management.git
   cd github-star-management
   ```

3. Set up your GitHub token:
   ```bash
   export GITHUB_TOKEN=your_github_token
   ```

## Basic Usage

Here are some basic commands to get you started:

```bash
# Show help
deno task start --help

# Clean up stars
deno task start cleanup --dry-run

# Back up stars
deno task start backup --output stars.json

# Categorize stars
deno task start categorize --output-dir star-lists

# Generate reports
deno task start report
```

## Documentation Sections

Our documentation is organized into several sections:

- [API Reference](api/index.md) - Detailed API documentation for programmatic usage
- [User Guides](guides/index.md) - Step-by-step guides for common tasks
- [Tutorials](tutorials/index.md) - In-depth tutorials for specific use cases
- [Examples](examples/index.md) - Example configurations and scripts

## Contributing

We welcome contributions to both the project and its documentation! See our [Contributing Guide](../CONTRIBUTING.md) for details on how to get involved.