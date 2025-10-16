export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};