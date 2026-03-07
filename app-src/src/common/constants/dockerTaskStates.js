/**
 * State representing a new task. The task was initialized.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_NEW = 'new'

/**
 * State representing a task that is ready. The worker node is ready to start the task.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_READY = 'ready'

/**
 * State representing a pending task. Resources for the task were allocated.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_PENDING = 'pending'

/**
 * State representing a task that is starting. Docker is starting the task.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_STARTING = 'starting'

/**
 * State representing a running task. The task is executing.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_RUNNING = 'running'

/**
 * State representing a complete task. The task exited without an error code.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_COMPLETE = 'complete'

/**
 * State representing a task that is shut down. Docker requested the task to shut down.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_SHUTDOWN = 'shutdown'

/**
 * State representing a failed task. The task exited with an error code.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_FAILED = 'failed'

/**
 * State representing a rejected task. The worker node rejected the task.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_REJECTED = 'rejected'

/**
 * State representing an orphaned task. The node was down for too long.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_ORPHANED = 'orphaned'

/**
 * State representing a task that is preparing. Docker is preparing the task.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_PREPARING = 'preparing'

/**
 * State representing an assigned task. Docker assigned the task to nodes.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_ASSIGNED = 'assigned'

/**
 * State representing an accepted task. The task was accepted by a worker node.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_ACCEPTED = 'accepted'

/**
 * State representing a task that is removed. The task is not terminal but the
 * associated service was removed or scaled down.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_REMOVE = 'remove'
