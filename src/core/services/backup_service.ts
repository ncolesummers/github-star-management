/**
 * BackupService implementation
 * 
 * Service for managing GitHub star backups using Deno KV
 */

import { Backup, BackupMeta, BackupOptions, BackupService as IBackupService } from "../models/backup.ts";
import { GitHubClient } from "../api/github_client.ts";

/**
 * BackupService implementation using Deno KV
 */
/**
 * Interface for KV storage to allow for testing with mocks
 * Matches Deno's Kv API structure
 */
// Deno KV key part types: string | number | boolean | Uint8Array
type KvKeyPart = string | number | boolean | Uint8Array;
type KvKey = KvKeyPart[];

interface KvStore {
  get<T = unknown>(key: KvKey, options?: { consistency?: unknown }): Promise<{ 
    key: KvKey; 
    value: T | null; 
    versionstamp: string | null 
  }>;
  set(key: KvKey, value: unknown): Promise<{ ok: true; versionstamp: string }>;
  delete(key: KvKey): Promise<void>;
  list<T = unknown>(selector: { prefix: KvKey }): AsyncIterableIterator<{ 
    key: KvKey; 
    value: T; 
    versionstamp: string 
  }>;
}

export class BackupService implements IBackupService {
  private kv: KvStore;
  private githubClient: GitHubClient;

  /**
   * Create a new BackupService
   * 
   * @param kv KV store instance
   * @param githubClient GitHub API client
   */
  constructor(kv: KvStore, githubClient: GitHubClient) {
    this.kv = kv;
    this.githubClient = githubClient;
  }

  /**
   * Create a new backup of starred repositories
   * 
   * @param options Backup options
   * @returns Backup metadata
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupMeta> {
    // Get current user and all starred repositories
    const [user, repositories] = await Promise.all([
      this.githubClient.getCurrentUser(),
      this.githubClient.getAllStarredRepos(),
    ]);

    // Generate a unique ID if not overwriting an existing backup
    const today = new Date().toISOString().split("T")[0];
    const id = options.overwrite
      ? (await this.getLatestBackupId()) || `backup-${today}`
      : `backup-${today}-${crypto.randomUUID().slice(0, 8)}`;

    // Create backup metadata
    const meta: BackupMeta = {
      id,
      createdAt: new Date().toISOString(),
      username: user.login,
      count: repositories.length,
      description: options.description,
      tags: options.tags,
    };

    // Create backup object
    const backup: Backup = {
      meta,
      repositories,
    };

    // Store in KV
    await this.kv.set(["backups", id, "meta"], meta);
    await this.kv.set(["backups", id, "data"], backup);

    return meta;
  }

  /**
   * List all available backups
   * 
   * @returns List of backup metadata
   */
  async listBackups(): Promise<BackupMeta[]> {
    const backups: BackupMeta[] = [];
    
    // Query KV for backup metadata - specifically looking for metadata entries
    for await (const entry of this.kv.list({ prefix: ["backups"] })) {
      const key = entry.key;
      
      // Only process metadata entries
      if (key.length === 3 && key[2] === "meta") {
        // Ensure we have a valid BackupMeta object
        const meta = entry.value as BackupMeta;
        if (meta && meta.id && meta.createdAt) {
          backups.push(meta);
        }
      }
    }
    
    // Sort by creation date (newest first)
    return backups.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Get a specific backup by ID
   * 
   * @param id Backup ID
   * @returns Backup or null if not found
   */
  async getBackup(id: string): Promise<Backup | null> {
    const result = await this.kv.get<Backup>(["backups", id, "data"]);
    return result.value || null;
  }

  /**
   * Delete a backup by ID
   * 
   * @param id Backup ID
   * @returns True if deleted, false if not found
   */
  async deleteBackup(id: string): Promise<boolean> {
    // Check if backup exists
    const backup = await this.getBackup(id);
    if (!backup) {
      return false;
    }
    
    // Delete both metadata and data
    await this.kv.delete(["backups", id, "meta"]);
    await this.kv.delete(["backups", id, "data"]);
    
    return true;
  }

  /**
   * Export a backup to a file
   * 
   * @param id Backup ID
   * @param filePath File path to export to
   */
  async exportBackup(id: string, filePath: string): Promise<void> {
    const backup = await this.getBackup(id);
    if (!backup) {
      throw new Error("Backup not found");
    }
    
    // Write to file
    const json = JSON.stringify(backup, null, 2);
    await Deno.writeTextFile(filePath, json);
  }

  /**
   * Import a backup from a file
   * 
   * @param filePath File path to import from
   * @param options Import options
   * @returns Backup metadata
   */
  async importBackup(filePath: string, options: BackupOptions = {}): Promise<BackupMeta> {
    // Read and parse file
    const json = await Deno.readTextFile(filePath);
    const backup = JSON.parse(json) as Backup;
    
    // If options specify overwrite, use the original ID, otherwise generate a new one
    if (!options.overwrite) {
      const today = new Date().toISOString().split("T")[0];
      backup.meta.id = `backup-${today}-imported-${Date.now().toString().slice(-6)}`;
    }
    
    // Update metadata if options are provided
    if (options.description !== undefined) {
      backup.meta.description = options.description;
    }
    
    if (options.tags !== undefined) {
      backup.meta.tags = options.tags;
    }
    
    // Update timestamp to current time
    backup.meta.createdAt = new Date().toISOString();
    
    // Store in KV
    await this.kv.set(["backups", backup.meta.id, "meta"], backup.meta);
    await this.kv.set(["backups", backup.meta.id, "data"], backup);
    
    return backup.meta;
  }

  /**
   * Get the ID of the most recent backup
   * 
   * @returns Most recent backup ID or null if none exist
   */
  private async getLatestBackupId(): Promise<string | null> {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0].id : null;
  }
}