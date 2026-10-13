import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineAggregator } from '../../src/background/timeline-aggregator';
import type { UserActionEvent, NetworkRequestEvent } from '../../src/shared/types/timeline';

describe('TimelineAggregator', () => {
  let aggregator: TimelineAggregator;

  beforeEach(() => {
    aggregator = new TimelineAggregator();
  });

  it('adds events and maintains timestamp order', () => {
    const event1: UserActionEvent = {
      id: '1',
      timestamp: 1000,
      type: 'USER_ACTION',
      action: 'click',
      selectorChain: [{ type: 'test-id', value: '[data-testid="btn"]', confidence: 0.95 }],
      preConditions: { visible: true, enabled: true },
    };
    const event2: UserActionEvent = {
      id: '2',
      timestamp: 500,
      type: 'USER_ACTION',
      action: 'type',
      selectorChain: [{ type: 'form-attr', value: 'input[name="q"]', confidence: 0.7 }],
      textValue: 'hello',
      preConditions: { visible: true, enabled: true },
    };

    aggregator.addEvent(event1);
    aggregator.addEvent(event2);

    const timeline = aggregator.getTimeline();
    expect(timeline.length).toBe(2);
    expect(timeline[0].timestamp).toBeLessThanOrEqual(timeline[1].timestamp);
  });

  it('correlates network events with user actions', () => {
    const action: UserActionEvent = {
      id: 'action-1',
      timestamp: 1000,
      type: 'USER_ACTION',
      action: 'click',
      selectorChain: [{ type: 'test-id', value: '[data-testid="submit"]', confidence: 0.95 }],
      preConditions: { visible: true, enabled: true },
    };

    const network: NetworkRequestEvent = {
      id: 'net-1',
      timestamp: 1200,
      type: 'NETWORK_REQUEST',
      requestId: 'req-1',
      url: 'https://api.example.com/submit',
      method: 'POST',
      requestHeaders: {},
      requestBody: '{"data":"test"}',
    };

    aggregator.addEvent(action);
    aggregator.addEvent(network);

    const timeline = aggregator.getTimeline();
    const networkEvent = timeline.find((e) => e.type === 'NETWORK_REQUEST');
    expect(networkEvent?.relatedActionId).toBe('action-1');
  });

  it('does not correlate events outside the correlation window', () => {
    const action: UserActionEvent = {
      id: 'action-1',
      timestamp: 1000,
      type: 'USER_ACTION',
      action: 'click',
      selectorChain: [{ type: 'test-id', value: '[data-testid="btn"]', confidence: 0.95 }],
      preConditions: { visible: true, enabled: true },
    };

    const network: NetworkRequestEvent = {
      id: 'net-1',
      timestamp: 5000,
      type: 'NETWORK_REQUEST',
      requestId: 'req-1',
      url: 'https://api.example.com/poll',
      method: 'GET',
      requestHeaders: {},
    };

    aggregator.addEvent(action);
    aggregator.addEvent(network);

    const timeline = aggregator.getTimeline();
    const networkEvent = timeline.find((e) => e.type === 'NETWORK_REQUEST');
    expect(networkEvent?.relatedActionId).toBeUndefined();
  });

  it('clears the timeline', () => {
    aggregator.addEvent({
      id: '1',
      timestamp: 1000,
      type: 'USER_ACTION',
      action: 'click',
      selectorChain: [],
      preConditions: { visible: true, enabled: true },
    } as UserActionEvent);

    expect(aggregator.getEventCount()).toBe(1);
    aggregator.clear();
    expect(aggregator.getEventCount()).toBe(0);
  });

  it('restores from saved events', () => {
    const events: UserActionEvent[] = [
      {
        id: '1',
        timestamp: 100,
        type: 'USER_ACTION',
        action: 'click',
        selectorChain: [],
        preConditions: { visible: true, enabled: true },
      },
      {
        id: '2',
        timestamp: 200,
        type: 'USER_ACTION',
        action: 'type',
        selectorChain: [],
        textValue: 'test',
        preConditions: { visible: true, enabled: true },
      },
    ];

    aggregator.restore(events);
    expect(aggregator.getEventCount()).toBe(2);
    expect(aggregator.getTimeline()).toEqual(events);
  });
});
