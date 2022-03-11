export const normalizeEmail = (email: string): string => {
  const m = email.match(/^(?<user>[^@]+)@(?<domain>.*)$/);
  if (!m?.groups) {
    return email.toLowerCase();
  }
  return m.groups.user.replace('.', '').toLowerCase() + "@" + m.groups.domain.toLowerCase();
};
