const absoluteUrlPattern = /^[a-z][a-z0-9+.-]*:/i;

export function createLocalPaths(pathname: string) {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const root = segments.length === 0 ? './' : '../'.repeat(segments.length);

  return {
    asset(path: string) {
      if (absoluteUrlPattern.test(path)) {
        return path;
      }

      return `${root}${path.replace(/^\/+/, '')}`;
    },
    route(path: string) {
      if (absoluteUrlPattern.test(path)) {
        return path;
      }

      const cleanPath = path.replace(/^\/+|\/+$/g, '');
      return cleanPath ? `${root}${cleanPath}/` : root;
    },
  };
}
