export default function AppIcon({ name, size = 20, className = '' }) {
  const paths = {
    home: <><path d="m3 11 9-7 9 7" /><path d="M5.5 9.5V20h13V9.5M9 20v-6h6v6" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4M12 16.5h.01" /></>,
    book: <><path d="M4 5.5c0-.8.7-1.4 1.5-1.3 2 .3 4.3 1 6.5 2.3 2.2-1.3 4.5-2 6.5-2.3.8-.1 1.5.5 1.5 1.3V17c0 .7-.6 1.3-1.3 1.4-2.2.3-4.6 1-6.7 2.3-2.1-1.3-4.5-2-6.7-2.3A1.4 1.4 0 0 1 4 17V5.5Z" /><path d="M12 6.5V19" /></>,
    chat: <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 4v-4A1.5 1.5 0 0 1 4 14.5v-9Z" />,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20h4" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    shield: <><path d="M12 3 20 6v6c0 5-3.2 8.1-8 10-4.8-1.9-8-5-8-10V6l8-3Z" /><path d="M12 8v8M8 12h8" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M7.3 3.5 10 8 7.8 9.8c1.1 2.3 2.9 4.1 5.2 5.2l1.8-2.2 4.5 2.7-.8 3.2c-.2.8-.9 1.3-1.7 1.3C9.7 20 4 14.3 4 7.2c0-.8.5-1.5 1.3-1.7l2-.5Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    activity: <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />,
    users: <><path d="M16 20c0-3-1.8-5-4-5s-4 2-4 5" /><circle cx="12" cy="9" r="3" /><path d="M18 8.5a2.5 2.5 0 0 1 0 5M19 16c1.2.8 2 2.2 2 4M6 8.5a2.5 2.5 0 0 0 0 5M5 16c-1.2.8-2 2.2-2 4" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></>,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.home}
    </svg>
  );
}
