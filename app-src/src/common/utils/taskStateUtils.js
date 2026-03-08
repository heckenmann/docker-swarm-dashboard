import {
  DOCKER_TASK_STATE_ACCEPTED,
  DOCKER_TASK_STATE_ASSIGNED,
  DOCKER_TASK_STATE_COMPLETE,
  DOCKER_TASK_STATE_FAILED,
  DOCKER_TASK_STATE_NEW,
  DOCKER_TASK_STATE_ORPHANED,
  DOCKER_TASK_STATE_PENDING,
  DOCKER_TASK_STATE_PREPARING,
  DOCKER_TASK_STATE_READY,
  DOCKER_TASK_STATE_REJECTED,
  DOCKER_TASK_STATE_REMOVE,
  DOCKER_TASK_STATE_RUNNING,
  DOCKER_TASK_STATE_SHUTDOWN,
  DOCKER_TASK_STATE_STARTING,
} from '../constants/dockerTaskStates'

/**
 * Returns the appropriate Bootstrap colour name for a given Docker task state.
 *
 * @param {string} state - The Docker task state string.
 * @returns {string} Bootstrap colour name, e.g. 'success', 'danger', 'warning', 'dark', 'secondary'.
 */
export const getStyleClassForState = (state) => {
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
