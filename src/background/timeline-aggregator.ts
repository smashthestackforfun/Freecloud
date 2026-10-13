import type { TimelineEvent } from '@shared/types/timeline';
import { CORRELATION_WINDOW_MS, FLUSH_INTERVAL_EVENTS, FLUSH_INTERVAL_MS } from '@shared/constants';
import { flushTimeline } from './storage-manager';

export class TimelineAggregator {
  private timeline: TimelineEvent[] = [];
  private lastFlush = Date.now();

  addEvent(event: TimelineEvent): void {
    if (event.type !== 'USER_ACTION' && !event.relatedActionId) {
      const relatedAction = this.findRelatedAction(event.timestamp);
      if (relatedAction) {
        event.relatedActionId = relatedAction.id;
      }
    }

    this.timeline.push(event);
    this.timeline.sort((a, b) => a.timestamp - b.timestamp);

    this.maybeFlush();
  }

  private findRelatedAction(timestamp: number): TimelineEvent | undefined {
    for (let i = this.timeline.length - 1; i >= 0; i--) {
      const event = this.timeline[i];
      if (event.type === 'USER_ACTION' && timestamp - event.timestamp <= CORRELATION_WINDOW_MS) {
        return event;
      }
    }
    return undefined;
  }

  private async maybeFlush(): Promise<void> {
    const elapsed = Date.now() - this.lastFlush;
    if (this.timeline.length % FLUSH_INTERVAL_EVENTS === 0 || elapsed >= FLUSH_INTERVAL_MS) {
      this.lastFlush = Date.now();
      await flushTimeline(this.timeline);
    }
  }

  getTimeline(): TimelineEvent[] {
    return [...this.timeline];
  }

  getEventCount(): number {
    return this.timeline.length;
  }

  clear(): void {
    this.timeline = [];
  }

  restore(events: TimelineEvent[]): void {
    this.timeline = events;
  }
}
