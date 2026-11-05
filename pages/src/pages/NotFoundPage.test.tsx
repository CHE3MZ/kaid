// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';
import { LanguageProvider } from '../i18n';

function renderNotFound() {
  return render(
    <MemoryRouter initialEntries={['/missing']}>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<div>home page</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('renders the not-found message and returns home', () => {
    renderNotFound();

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(
      screen.getByText('The page you are looking for does not exist or has moved.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(screen.getByText('home page')).toBeTruthy();
  });
});
