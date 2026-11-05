// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import React from 'react';
import githubIcon from '../assets/icons/icon-github.svg';
import { useTranslation } from '../i18n/context';
import { useResponsive } from '../hooks/useResponsive';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  return (
    <footer
      style={{
        width: '100%',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: isMobile ? '32px 16px' : '64px 32px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 16 : 0,
          maxWidth: 1440,
          margin: '0 auto',
        }}
      >
        <a href="https://github.com/CHE3MZ/kaid" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <img src={githubIcon} alt="" style={{ width: 18, height: 18 }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{t('footer.brand')}</span>
        </a>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          {t('footer.copyright')}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
