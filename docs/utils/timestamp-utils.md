# Timestamp Utilities

This documentation describes the timestamp utility functions available in the codebase.

## Functions

### formatTimestamp

Converts a Unix timestamp (milliseconds) to an ISO 8601 string.

```typescript
function formatTimestamp(timestamp: number): string
```

### parseTimestamp

Converts an ISO 8601 string to a Unix timestamp (milliseconds).

```typescript
function parseTimestamp(isoString: string): number
```

## Examples

```typescript
// Format a timestamp
const timestamp = Date.now();
const formattedDate = formatTimestamp(timestamp);
console.log(formattedDate); // e.g. "2025-06-09T00:35:42.123Z"

// Parse a timestamp
const parsedTimestamp = parseTimestamp("2025-06-09T00:35:42.123Z");
console.log(parsedTimestamp); // e.g. 1748743742123
```