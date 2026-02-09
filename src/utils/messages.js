import { CLI_COMMAND } from '../constants.js';

export function commandText(args) {
  return `${CLI_COMMAND} ${args}`;
}
