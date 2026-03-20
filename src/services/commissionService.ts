/**
 * محرك حسابات العمولات المستقل
 * يقوم بحساب العمولة بناءً على نسبة الوكيل.
 */
export const calculateAgentCommission = (
  agentPercentage: number,
  transactionAmount: number
): number => {
  // حساب مبلغ العمولة
  return (transactionAmount * agentPercentage) / 100;
};
