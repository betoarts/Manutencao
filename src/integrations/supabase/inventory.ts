import { supabase } from './client';

export const getInventory = async () => {
  const { data, error } = await supabase
    .from('purchases')
    .select('product_name, quantity')
    .not('product_name', 'is', null)
    .not('quantity', 'is', null);

  if (error) throw error;

  // Processa os dados para agregar as quantidades por produto
  const inventoryMap = new Map<string, number>();
  data.forEach(purchase => {
    if (purchase.product_name && purchase.quantity) {
      const currentQuantity = inventoryMap.get(purchase.product_name) || 0;
      inventoryMap.set(purchase.product_name, currentQuantity + purchase.quantity);
    }
  });

  const inventoryList = Array.from(inventoryMap.entries()).map(([name, quantity]) => ({
    name,
    quantity,
  }));

  return inventoryList.sort((a, b) => a.name.localeCompare(b.name));
};