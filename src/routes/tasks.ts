
import { Router, Request, Response } from "express";
import { TaskService } from "../services/taskService";
import { Database } from "../db/database";

export function createTaskRouter(db: Database): Router {
  const router = Router();
  const taskService = new TaskService(db);

  // GET all tasks
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const tasks = await taskService.getAllTasks();
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch tasks", details: err.message });
    }
  });

  // GET single task
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const task = await taskService.getTask(req.params.id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch task", details: err.message });
    }
  });

  // POST create task
  router.post("/", async (req: Request, res: Response) => {
    try {
      if (!req.body.title) return res.status(400).json({ error: "Title is required" });
      const task = await taskService.createTask(req.body);
      res.status(201).json(task);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create task", details: err.message });
    }
  });

  // PUT update task
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const task = await taskService.updateTask(req.params.id, req.body);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update task", details: err.message });
    }
  });

  // DELETE task
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const ok = await taskService.deleteTask(req.params.id);
      if (!ok) return res.status(404).json({ error: "Task not found" });
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete task", details: err.message });
    }
  });

  return router;
}
