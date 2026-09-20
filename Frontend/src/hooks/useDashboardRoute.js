import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useDashboardRoute(basePath, navItems) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const defaultItem = navItems[0];
  const activeItem = navItems.find((item) => pathname === `${basePath}/${item.path}`);
  const defaultPath = `${basePath}/${defaultItem.path}`;

  useEffect(() => {
    if (!activeItem) navigate(defaultPath, { replace: true });
  }, [activeItem, defaultPath, navigate]);

  function onNavigate(key) {
    const item = navItems.find((candidate) => candidate.key === key);
    if (item) navigate(`${basePath}/${item.path}`);
  }

  return { activePage: activeItem?.key || defaultItem.key, onNavigate };
}
