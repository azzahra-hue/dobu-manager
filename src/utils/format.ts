export const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(dateString));
};

export const generateId = () => crypto.randomUUID();

export const getOrderUnitCost = (order: { costPrice?: number }, product?: { costPrice?: number }): number => {
  if (order.costPrice !== undefined && order.costPrice !== null) {
    return order.costPrice;
  }
  return product?.costPrice || 0;
};
