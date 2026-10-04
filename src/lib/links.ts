export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (path = '') =>
  /^https:\/\//.test(path)
    ? path
    : `${base}/${path.replace(/^\//, '').replace(/(\?[^#]*)\/$/, '$1')}`;
