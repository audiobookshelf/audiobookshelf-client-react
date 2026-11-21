import { createLatestSnapshotThrottle } from '@/lib/latestSnapshotThrottle'

type Snapshot = { id: string; n: number }

function createFakeTimers() {
  let now = 0
  let nextId = 1
  const timers = new Map<number, { fireAt: number; fn: () => void }>()

  return {
    now: () => now,
    setTimeout(fn: () => void, ms: number) {
      const id = nextId++
      timers.set(id, { fireAt: now + ms, fn })
      return id as unknown as ReturnType<typeof setTimeout>
    },
    clearTimeout(id: ReturnType<typeof setTimeout>) {
      timers.delete(Number(id))
    },
    advance(ms: number) {
      now += ms
      const due = [...timers.entries()].filter(([, timer]) => timer.fireAt <= now).sort((a, b) => a[1].fireAt - b[1].fireAt)
      for (const [id, timer] of due) {
        timers.delete(id)
        timer.fn()
      }
    }
  }
}

function createHarness(itemId = 'item-a') {
  const applied: Snapshot[] = []
  let currentItemId = itemId
  const timers = createFakeTimers()
  const throttle = createLatestSnapshotThrottle<Snapshot>({
    intervalMs: 200,
    getCurrentItemId: () => currentItemId,
    apply: (snapshot) => applied.push(snapshot),
    setTimeoutFn: timers.setTimeout,
    clearTimeoutFn: timers.clearTimeout
  })

  return {
    applied,
    setCurrentItemId(id: string) {
      currentItemId = id
    },
    schedule(n: number, id = currentItemId) {
      throttle.schedule({ id, n })
    },
    reset: throttle.reset,
    advance: timers.advance
  }
}

describe('createLatestSnapshotThrottle', () => {
  it('applies the latest snapshot on a regular interval while events continue', () => {
    const harness = createHarness()

    harness.schedule(1)
    harness.schedule(2)
    harness.schedule(3)
    harness.advance(199)
    expect(harness.applied).to.deep.equal([])

    harness.advance(1)
    expect(harness.applied.map((snapshot) => snapshot.n)).to.deep.equal([3])

    harness.schedule(4)
    harness.schedule(5)
    harness.advance(200)
    expect(harness.applied.map((snapshot) => snapshot.n)).to.deep.equal([3, 5])
  })

  it('still applies the last snapshot after events stop', () => {
    const harness = createHarness()

    harness.schedule(1)
    harness.schedule(8)
    harness.advance(200)
    expect(harness.applied.map((snapshot) => snapshot.n)).to.deep.equal([8])

    harness.advance(400)
    expect(harness.applied.map((snapshot) => snapshot.n)).to.deep.equal([8])
  })

  it('does not apply a pending snapshot after reset on item change or unmount', () => {
    const harness = createHarness('item-a')

    harness.schedule(4)
    harness.setCurrentItemId('item-b')
    harness.reset()
    harness.advance(200)
    expect(harness.applied).to.deep.equal([])

    harness.schedule(1)
    harness.reset()
    harness.advance(200)
    expect(harness.applied).to.deep.equal([])
  })

  it('ignores snapshots for a different item id', () => {
    const harness = createHarness('item-a')

    harness.schedule(9, 'item-b')
    harness.advance(200)
    expect(harness.applied).to.deep.equal([])
  })
})
