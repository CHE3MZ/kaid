// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import { HostToWebview, WebviewToHost } from '../shared/messages';

export interface Bridge {
  post(msg: WebviewToHost): void;
  onMessage(handler: (msg: HostToWebview) => void): () => void;
}

type Handler = (msg: HostToWebview) => void;

const handlers = new Set<Handler>();

window.addEventListener('message', (event) => {
  handlers.forEach((handler) => {
    try {
      handler(event.data as HostToWebview);
    } catch (err) {
      console.error('[ocr] message handler failed', err);
    }
  });
});

export const bridge: Bridge = {
  post(msg: WebviewToHost): void {
    if (window.parent === window) {
      console.warn('[ocr] no host window is available');
      return;
    }
    window.parent.postMessage(msg, '*');
  },
  onMessage(handler: Handler): () => void {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },
};
