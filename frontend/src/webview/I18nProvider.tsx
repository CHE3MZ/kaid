// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import { t } from '../shared/i18n';

export function useT(): (key: string) => string {
  return t;
}

export { t };
