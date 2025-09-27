class EventBus {
  private events: Record<string, ((...args: any[]) => void)[]> = {}

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) {
      return
    }
    this.events[event].forEach((callback) => callback(...args))
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      return
    }
    this.events[event] = this.events[event].filter((cb) => cb !== callback)
  }
}

const eventBus = new EventBus()

export default eventBus
