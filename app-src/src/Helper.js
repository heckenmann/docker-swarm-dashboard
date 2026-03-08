/**
 * @deprecated Import directly from 'common/constants/dockerTaskStates' or
 *   'common/utils/taskStateUtils' instead. This re-export shim will be removed
 *   in a future cleanup.
 */
export {
  DOCKER_TASK_STATE_NEW,
  DOCKER_TASK_STATE_READY,
  DOCKER_TASK_STATE_PENDING,
  DOCKER_TASK_STATE_STARTING,
  DOCKER_TASK_STATE_RUNNING,
  DOCKER_TASK_STATE_COMPLETE,
  DOCKER_TASK_STATE_SHUTDOWN,
  DOCKER_TASK_STATE_FAILED,
  DOCKER_TASK_STATE_REJECTED,
  DOCKER_TASK_STATE_ORPHANED,
  DOCKER_TASK_STATE_PREPARING,
  DOCKER_TASK_STATE_ASSIGNED,
  DOCKER_TASK_STATE_ACCEPTED,
  DOCKER_TASK_STATE_REMOVE,
} from './common/constants/dockerTaskStates'

export { getStyleClassForState } from './common/utils/taskStateUtils'
