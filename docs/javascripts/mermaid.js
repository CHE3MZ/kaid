// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import mermaid from "https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

document$.subscribe(() => {
  mermaid.run({ querySelector: ".mermaid" });
});
