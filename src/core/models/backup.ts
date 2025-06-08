/**
 * Backup models
 *
 * Type definitions for backup-related functionality
 */

import { Repository } from "./mod.ts";

/**
 * Backup metadata
 */
export interface BackupMeta {
  id: string;
  createdAt: string;
  username: string;
  count: number;
  description?: string;
  tags?: string[];
}

/**
 * Backup record
 */
export interface Backup {
  meta: BackupMeta;
  repositories: Repository[];
}

/**
 * Backup options
 */
export interface BackupOptions {
  description?: string;
  tags?: string[];
  overwrite?: boolean;
}

/**
 * Backup service interface
 */
export interface BackupService {
  /**
   * Create a new backup of starred repositories
   */
  createBackup(options?: BackupOptions): Promise<BackupMeta>;

  /**
   * List all available backups
   */
  listBackups(): Promise<BackupMeta[]>;

  /**
   * Get a specific backup by ID
   */
  getBackup(id: string): Promise<Backup | null>;

  /**
   * Delete a backup by ID
   */
  deleteBackup(id: string): Promise<boolean>;

  /**
   * Export a backup to a file
   */
  exportBackup(id: string, filePath: string): Promise<void>;

  /**
   * Import a backup from a file
   */
  importBackup(filePath: string, options?: BackupOptions): Promise<BackupMeta>;
}
