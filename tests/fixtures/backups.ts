/**
 * Mock backup data for tests
 *
 * These fixtures simulate backup data stored in Deno KV
 */

import { Backup, BackupMeta } from "../../src/core/models/backup.ts";
import { mockRepos } from "./repositories.ts";

// Sample backup metadata
export const mockBackupMetas: BackupMeta[] = [
  {
    id: "backup-2023-06-15",
    createdAt: "2023-06-15T12:00:00Z",
    username: "testuser",
    count: 3,
    description: "First test backup",
    tags: ["test", "initial"],
  },
  {
    id: "backup-2023-07-20",
    createdAt: "2023-07-20T14:30:00Z",
    username: "testuser",
    count: 5,
    description: "Second test backup with more repos",
    tags: ["test", "expanded"],
  },
  {
    id: "backup-2023-08-10",
    createdAt: "2023-08-10T09:15:00Z",
    username: "testuser",
    count: 2,
    description: "Minimal test backup",
    tags: ["test", "minimal"],
  },
];

// Sample complete backups
export const mockBackups: Backup[] = [
  {
    meta: mockBackupMetas[0],
    repositories: mockRepos.slice(0, 3),
  },
  {
    meta: mockBackupMetas[1],
    repositories: mockRepos,
  },
  {
    meta: mockBackupMetas[2],
    repositories: mockRepos.slice(3, 5),
  },
];

// Helper to create a new mock backup
export function createMockBackup(
  options: {
    id?: string;
    createdAt?: string;
    username?: string;
    description?: string;
    tags?: string[];
    repositories?: typeof mockRepos;
  } = {},
): Backup {
  const now = new Date().toISOString();
  const id = options.id || `backup-${now.split("T")[0]}`;
  const repos = options.repositories || mockRepos.slice(0, 3);

  return {
    meta: {
      id,
      createdAt: options.createdAt || now,
      username: options.username || "testuser",
      count: repos.length,
      description: options.description,
      tags: options.tags,
    },
    repositories: repos,
  };
}

// Sample backup keys for KV store
export const mockBackupKeys = mockBackupMetas.map((
  meta,
) => ["backups", meta.id]);

// Sample JSON backup file content
export const mockBackupFileContent = JSON.stringify(mockBackups[0], null, 2);
