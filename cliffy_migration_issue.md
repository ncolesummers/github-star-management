## Title: Migrate from Cliffy direct imports to JSR imports or alternative CLI library

### Description

We're currently using Cliffy (`https://deno.land/x/cliffy@v1.0.0-rc.3`) for our
CLI interface, but this is causing some issues:

1. The Cliffy library appears to be stagnant with no new versions in 8 months
2. The move to JSR is causing compatibility issues (the latest version on JSR is
   1.0.0-rc.7)
3. There are breaking changes between versions that are affecting our tests

When trying to update the imports to use JSR versions, we encountered runtime
errors like:

```
TypeError: args.trim is not a function
  const parts = args.trim().split(/[, =] */g);
```

We should investigate one of these options:

1. Fully migrate to Cliffy from JSR with proper versioning
2. Consider an alternative CLI library that's more actively maintained
3. Wait for Cliffy to publish a stable 1.0.0 release

### Acceptance Criteria

- Choose a migration strategy (update or replace Cliffy)
- Implement the chosen strategy
- Ensure all CLI tests pass
- Document the changes and any API differences

### Additional Information

- Current version: Cliffy v1.0.0-rc.3 from deno.land
- JSR version: Cliffy v1.0.0-rc.7
- The CLI tests are currently skipped due to compatibility issues
- This is a non-critical issue as the core functionality works fine
