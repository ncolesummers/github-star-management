# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Local backup functionality using Deno KV storage
  - Create backups of starred repositories
  - List, view, and delete backups
  - Export backups to files
  - Import backups from files
- Comprehensive documentation for backup commands
- Test suite for backup functionality
  - Unit tests for BackupService
  - Integration tests for CLI commands
  - Mock KV store for testing

### Changed

- Updated README with backup command usage
- Improved CLI architecture to support nested commands

### Fixed

- CLI integration with type checking and linting support
