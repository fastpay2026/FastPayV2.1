
export const formatDisplayNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  // استخدام parseFloat لتحويل الرقم إلى نص وإزالة الأصفار الزائدة
  return Number.parseFloat(num.toFixed(2)).toString();
};
