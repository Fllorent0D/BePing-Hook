import * as cache from './type-cache';

export const EventTypes = {
  EXEC_CMD: cache.type('EXEC_CMD'),
  EXEC_ADD_LISTENER: cache.type('EXEC_ADD_LISTENER'),
  EXEC_CLEAN_LISTENERS: cache.type('EXEC_CLEAN_LISTENERS'),
  EXEC_CMD_SUCCESS: cache.type('EXEC_CMD_SUCCESS'),
  EXEC_CMD_FAILURE: cache.type('EXEC_CMD_FAILURE')
};
