
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

export const suggestProductsForCustomer = async (
  customerName: string,
  purchaseHistory: { productName: string; quantity: number }[],
  allProducts: { id: string; name: string }[]
): Promise<string[] | null> => {
  const prompt = `Suggest 3 product IDs for "${customerName}" based on history: ${JSON.stringify(purchaseHistory)}. Available: ${JSON.stringify(allProducts)}. Return JSON array of IDs.`;
  const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
  if (!text) return null;
  return JSON.parse(cleanJsonString(text));
};
