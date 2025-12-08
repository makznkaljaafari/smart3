export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};
