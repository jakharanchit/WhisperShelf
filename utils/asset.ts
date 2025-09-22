export const asset = (rel: string) => {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedRel = rel.startsWith('/') ? rel.slice(1) : rel;
  return `${normalizedBase}/${normalizedRel}`;
};
