
import axios from "axios";
import { Task, SyncQueueItem, SyncResult, SyncError, BatchSyncRequest, BatchSyncResponse } from "../types";
import { Database } from "../db/database";
import { TaskService } from "./taskService";

export class SyncService {
  private apiUrl: string;

  constructor(private db: Database, private taskService: TaskService, apiUrl?: string) {
    this.apiUrl = apiUrl ?? process.env.API_BASE_URL ?? "http://localhost:3000/api";
  }

  async sync(): Promise<SyncResult> {
    const tasks = await this.taskService.getTasksNeedingSync();
    if (tasks.length === 0) return { success: true, synced_items: 0, failed_items: 0, errors: [] };

    const batchSize = parseInt(process.env.SYNC_BATCH_SIZE ?? "10", 10);
    let synced = 0, failed = 0;
    const errors: SyncError[] = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);

      try {
        const response = await this.processBatch(batch.map(t => ({
          id: t.id,
          task_id: t.id,
          operation: "update",
          data: t,
          created_at: new Date(),
          retry_count: 0,
        })));

        for (const item of response.processed_items) {
          if (item.status === "success") {
            await this.updateSyncStatus(item.client_id, "synced");
            synced++;
          } else {
            await this.updateSyncStatus(item.client_id, "error");
            failed++;
            errors.push({
              task_id: item.client_id,
              operation: "update",
              error: item.error ?? "Unknown error",
              timestamp: new Date(),
            });
          }
        }
      } catch (err: any) {
        failed += batch.length;
        for (const t of batch) {
          await this.updateSyncStatus(t.id, "error");
          errors.push({
            task_id: t.id,
            operation: "update",
            error: err.message ?? "Batch sync failed",
            timestamp: new Date(),
          });
        }
      }
    }

    return { success: failed === 0, synced_items: synced, failed_items: failed, errors };
  }

  private async processBatch(items: SyncQueueItem[]): Promise<BatchSyncResponse> {
    const payload: BatchSyncRequest = { items, client_timestamp: new Date() };
    const { data } = await axios.post<BatchSyncResponse>(`${this.apiUrl}/batch`, payload);
    return data;
  }

  private async updateSyncStatus(taskId: string, status: "synced" | "error", serverData?: Partial<Task>) {
    await this.db.run(
      `UPDATE tasks 
       SET sync_status = ?, last_synced_at = ?, server_id = COALESCE(?, server_id)
       WHERE id = ?`,
      [status, new Date().toISOString(), serverData?.server_id ?? null, taskId]
    );
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
