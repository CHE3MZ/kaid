// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useResponsive } from '../hooks/useResponsive';
import socialIcon from '../assets/icons/icon-github.svg';
import brandIcon from '../assets/images/brandicon.svg';

const navTabs = [
  { path: '/features', labelKey: 'navbar.features' },
  { path: '/benchmark', labelKey: 'navbar.benchmark' },
  { path: '/quickstart', labelKey: 'navbar.quickstart' },
  { path: '/docs', labelKey: 'navbar.docs' },
  { path: '/blog', labelKey: 'navbar.blog' },
];

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <nav
      style={{
        width: '100%',
        height: isMobile ? 56 : 72,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '1px solid rgba(61,61,61,0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        willChange: 'transform',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1440,
          height: isMobile ? 56 : 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '0 16px' : '0 32px',
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img src={brandIcon} alt="Open Code Review" style={{ height: isMobile ? 20 : 24 }} />
        </div>

        {/* Nav Tabs - hidden on mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navTabs.map((tab) => {
              const isActive = tab.path === '/features'
                ? (currentPath === '/' || currentPath.startsWith('/features'))
                : currentPath.startsWith(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      lineHeight: '20px',
                      opacity: isActive ? 1 : 0.6,
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {t(tab.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right section */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16 }}>
          <a
            href="https://github.com/CHE3MZ/kaid"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}
          >
            <img src={socialIcon} alt="Social" style={{ width: 22, height: 22 }} />
          </a>
          <button
            onClick={() => navigate('/quickstart')}
            style={{
              height: 32,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#ffffff',
              border: '1px solid #EBEBEB',
              borderRadius: 6,
              color: 'rgba(0,0,0,0.77)',
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('navbar.getStarted')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
