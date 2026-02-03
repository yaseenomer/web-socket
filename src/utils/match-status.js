import { MATCH_STATUS } from "../validation/matches.js";

/**
 * Determine a match's status based on its start and end times relative to a reference time.
 *
 * @param {string|number|Date} startTime - Value parseable as the match start time.
 * @param {string|number|Date} endTime - Value parseable as the match end time.
 * @param {Date} [now=new Date()] - Reference time used to evaluate status.
 * @returns {string|null} `MATCH_STATUS.SCHEDULED` if `now` is before the start, `MATCH_STATUS.FINISHED` if `now` is on or after the end, `MATCH_STATUS.LIVE` otherwise; returns `null` if either start or end cannot be parsed as a valid date.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

/**
 * Ensure a match object's status reflects its current time window, invoking the provided updater if a change is required.
 * @param {object} match - Match object containing `startTime`, `endTime`, and `status` properties; `status` will be updated in-place when changed.
 * @param {(newStatus: string) => Promise<void>} updateStatus - Async callback invoked with the new status when an update is needed.
 * @returns {string} The match's status after any potential update.
 */
export async function syncMatchStatus(match, updateStatus) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }
  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}