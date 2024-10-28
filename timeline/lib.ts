let currentObservers: any[] = [];

type Disposable = {
  dispose: () => void;
};

type Observable<T> = {
  (value?: T): T;
  subscribe: (clb: (value: T) => void) => Disposable;
} & Disposable;

/**
 * Mini knockout.
 */
export function observable<T = any>(
  value?: T,
  options?: {
    deep?: boolean;
  }
): Observable<T> {
  let listeners = [] as any[];
  const obj = function(arg?: any) {
    if (arg === undefined) {
      currentObservers.forEach((clb) => clb(obj));
      return value;
    } else {
      if (options?.deep) {
        if (JSON.stringify(value) !== JSON.stringify(arg)) {
          value = arg;
          listeners.forEach((clb: any) => clb(arg));
        }
      } else if (value !== arg) {
        value = arg;
        listeners.forEach((clb: any) => clb(arg));
      }
      return arg;
    }
  };

  obj.subscribe = function(clb: any) {
    listeners.push(clb);
    return {dispose(){ listeners.splice(listeners.indexOf(clb), 1); }};
  };

  obj.dispose = function() {
    listeners = [];
  };

  return obj as Observable<T>;
}

export function computed(clb: () => any) {
  const value = observable();
  const listeners = [] as any[];
  function recompute() {
    try {
      listeners.forEach(l => l.dispose());
      currentObservers.push((obs: Observable<any>) => {
        listeners.push(obs.subscribe(recompute));
      });
      value(clb());
    } finally {
      currentObservers.pop();
    }
  }
  recompute();
  return value;
}
