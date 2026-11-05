// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import React, { createContext, useContext } from 'react';
import { TranslationKey } from './types';
import { en } from './en';

interface LanguageContextValue {
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const value: LanguageContextValue = {
  t: (key: string) => en[key as TranslationKey] ?? key,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
