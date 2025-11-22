import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday, isThisWeek, isThisMonth } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const getDateRange = (range: 'today' | 'week' | 'month' | 'all') => {
  const now = new Date();
  
  switch (range) {
    case 'today':
      return {
        startDate: format(now, 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd'),
      };
    case 'week':
      return {
        startDate: format(startOfWeek(now), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(now), 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    default:
      return {};
  }
};

export const isDateInRange = (
  date: string | Date,
  range: 'today' | 'week' | 'month'
): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  switch (range) {
    case 'today':
      return isToday(dateObj);
    case 'week':
      return isThisWeek(dateObj);
    case 'month':
      return isThisMonth(dateObj);
    default:
      return false;
  }
};

export const getMonthName = (month: number): string => {
  const date = new Date(2000, month - 1, 1);
  return format(date, 'MMMM');
};

