import EventEmitter from 'events';

export class TaskManager extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.pollInterval = parseInt(process.env.TASK_POLL_INTERVAL) || 3000;
    this.maxPollAttempts = parseInt(process.env.TASK_MAX_POLL_ATTEMPTS) || 100;
    this.taskTimeout = parseInt(process.env.TASK_TIMEOUT) || 300000;
  }

  createTask(taskId, queryFn, options = {}) {
    const task = {
      id: taskId,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
      createdAt: Date.now(),
      pollAttempts: 0,
      maxPollAttempts: options.maxPollAttempts || this.maxPollAttempts,
      queryFn,
      intervalId: null,
      sseClients: new Set()
    };

    this.tasks.set(taskId, task);
    this._startPolling(taskId);
    return task;
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    return {
      id: task.id,
      status: task.status,
      progress: task.progress,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt
    };
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.intervalId) clearInterval(task.intervalId);
    task.status = 'cancelled';
    this._notifyClients(taskId);
    this.tasks.delete(taskId);
    return true;
  }

  addSSEClient(taskId, res) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const sendData = (data) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch { /* client disconnected */ }
    };

    if (task.status === 'completed' || task.status === 'failed') {
      sendData({ status: task.status, result: task.result, error: task.error });
      res.end();
      return true;
    }

    sendData({ status: task.status, progress: task.progress });
    task.sseClients.add({ res, sendData });

    res.on('close', () => {
      task.sseClients.delete({ res, sendData });
    });

    return true;
  }

  _startPolling(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.intervalId = setInterval(async () => {
      try {
        if (Date.now() - task.createdAt > this.taskTimeout) {
          task.status = 'failed';
          task.error = 'Task timed out';
          this._stopPolling(taskId);
          this._notifyClients(taskId);
          return;
        }

        task.pollAttempts++;
        if (task.pollAttempts > task.maxPollAttempts) {
          task.status = 'failed';
          task.error = 'Max poll attempts exceeded';
          this._stopPolling(taskId);
          this._notifyClients(taskId);
          return;
        }

        const result = await task.queryFn(taskId);

        if (!result.success) {
          return;
        }

        const data = result.data;
        const status = this._extractStatus(data);

        if (status === 'completed' || status === 'succeed' || status === 'success') {
          task.status = 'completed';
          task.progress = 100;
          task.result = this._extractResult(data);
          this._stopPolling(taskId);
          this._notifyClients(taskId);
        } else if (status === 'failed' || status === 'error') {
          task.status = 'failed';
          task.error = this._extractError(data);
          this._stopPolling(taskId);
          this._notifyClients(taskId);
        } else {
          task.progress = this._extractProgress(data);
          this._notifyClients(taskId);
        }
      } catch (err) {
        console.error(`Task ${taskId} poll error:`, err.message);
      }
    }, this.pollInterval);
  }

  _stopPolling(taskId) {
    const task = this.tasks.get(taskId);
    if (task?.intervalId) {
      clearInterval(task.intervalId);
      task.intervalId = null;
    }
  }

  _notifyClients(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const update = {
      id: task.id,
      status: task.status,
      progress: task.progress,
      result: task.result,
      error: task.error
    };

    this.emit('taskUpdate', update);

    for (const client of task.sseClients) {
      try {
        client.sendData(update);
        if (task.status === 'completed' || task.status === 'failed') {
          client.res.end();
        }
      } catch { /* ignore */ }
    }

    if (task.status === 'completed' || task.status === 'failed') {
      task.sseClients.clear();
      setTimeout(() => this.tasks.delete(taskId), 60000);
    }
  }

  _extractStatus(data) {
    if (data.status) return data.status;
    if (data.task_status) return data.task_status;
    if (data.state) return data.state;
    if (data.data?.task_status) return data.data.task_status;
    return 'pending';
  }

  _extractProgress(data) {
    if (data.progress_pct) return Math.round(data.progress_pct * 100);
    if (data.progress) return data.progress;
    if (data.data?.progress) return data.data.progress;
    return 50;
  }

  _extractResult(data) {
    if (data.video_url) return { videoUrl: data.video_url };
    if (data.data?.task_result?.videos) {
      return { videos: data.data.task_result.videos };
    }
    if (data.data?.task_result?.images) {
      return { images: data.data.task_result.images };
    }
    if (data.images) return { images: data.images };
    if (data.video) return { video: data.video };
    if (data.artifact?.video) return { video: data.artifact.video };
    if (data.content?.video_url) return { videoUrl: data.content.video_url };
    return data;
  }

  _extractError(data) {
    if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    if (data.data?.task_status_msg) return data.data.task_status_msg;
    if (data.message) return data.message;
    return 'Unknown error';
  }
}

export const taskManager = new TaskManager();
