
import { v4 as uuidv4 } from "uuid";
import { Task } from "../types";
import { Database } from "../db/database";

export class TaskService {
  constructor(private db: Database) {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const id = uuidv4();
    const now = new Date(); // Date object

    const task: Task = {
      id,
      title: taskData.title ?? "",
      description: taskData.description ?? "",
      completed: false,
      is_deleted: false,
      updated_at: now,
      sync_status: "pending",
    };

    await this.db.run(
      `INSERT INTO tasks (id, title, description, completed, is_deleted, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description,
        task.completed ? 1 : 0,
        task.is_deleted ? 1 : 0,
        task.updated_at.toISOString(),
        task.sync_status,
      ]
    );

    await this.db.run(
      `INSERT INTO sync_queue (task_id, operation, data, retry_count, created_at)
       VALUES (?, 'create', ?, 0, ?)`,
      [task.id, JSON.stringify(task), now.toISOString()]
    );

    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const existing = await this.getTask(id);
    if (!existing) return null;

    const now = new Date();
    const updated: Task = {
      ...existing,
      ...updates,
      updated_at: now,
      sync_status: "pending",
    };

    await this.db.run(
      `UPDATE tasks
       SET title = ?, description = ?, completed = ?, is_deleted = ?, updated_at = ?, sync_status = ?
       WHERE id = ?`,
      [
        updated.title,
        updated.description,
        updated.completed ? 1 : 0,
        updated.is_deleted ? 1 : 0,
        updated.updated_at.toISOString(),
        updated.sync_status,
        id,
      ]
    );

    await this.db.run(
      `INSERT INTO sync_queue (task_id, operation, data, retry_count, created_at)
       VALUES (?, 'update', ?, 0, ?)`,
      [id, JSON.stringify(updated), now.toISOString()]
    );

    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const existing = await this.getTask(id);
    if (!existing) return false;

    const now = new Date();

    await this.db.run(
      `UPDATE tasks
       SET is_deleted = 1, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
      [now.toISOString(), id]
    );

    await this.db.run(
      `INSERT INTO sync_queue (task_id, operation, data, retry_count, created_at)
       VALUES (?, 'delete', ?, 0, ?)`,
      [id, JSON.stringify(existing), now.toISOString()]
    );

    return true;
  }

  async getTask(id: string): Promise<Task | null> {
    const row = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (!row || row.is_deleted) return null;
    return { ...row, updated_at: new Date(row.updated_at) } as Task;
  }

  async getAllTasks(): Promise<Task[]> {
    const rows = await this.db.all(`SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY updated_at DESC`);
    return rows.map(r => ({ ...r, updated_at: new Date(r.updated_at) })) as Task[];
  }

  async getTasksNeedingSync(): Promise<Task[]> {
    const rows = await this.db.all(`SELECT * FROM tasks WHERE sync_status IN ('pending','error')`);
    return rows.map(r => ({ ...r, updated_at: new Date(r.updated_at) })) as Task[];
  }
}
