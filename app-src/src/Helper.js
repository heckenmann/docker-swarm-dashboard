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
 * State representing a task that is removed. The task is not terminal but the associated service was removed or scaled down.
 * @constant {string}
 */
export const DOCKER_TASK_STATE_REMOVE = 'remove'

/**
 * Returns the appropriate style class for a given state.
 *
 * @param {string} state - The state for which to get the style class.
 * @returns {string} - The style class corresponding to the state.
 */
const getStyleClassForState = (state) => {
  switch (state) {
    case DOCKER_TASK_STATE_RUNNING:
      return 'success'
    case DOCKER_TASK_STATE_FAILED:
    case DOCKER_TASK_STATE_REJECTED:
    case DOCKER_TASK_STATE_ORPHANED:
      return 'danger'
    case DOCKER_TASK_STATE_SHUTDOWN:
    case DOCKER_TASK_STATE_COMPLETE:
      return 'dark'
    case DOCKER_TASK_STATE_NEW:
    case DOCKER_TASK_STATE_READY:
    case DOCKER_TASK_STATE_PENDING:
    case DOCKER_TASK_STATE_PREPARING:
    case DOCKER_TASK_STATE_STARTING:
    case DOCKER_TASK_STATE_ASSIGNED:
    case DOCKER_TASK_STATE_ACCEPTED:
    case DOCKER_TASK_STATE_REMOVE:
      return 'warning'
    default:
      return 'secondary'
  }
}

export { getStyleClassForState }
