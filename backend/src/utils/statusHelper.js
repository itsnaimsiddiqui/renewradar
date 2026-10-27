const EXPIRING_SOON_DAYS = parseInt(process.env.EXPIRING_SOON_DAYS, 10) || 30;

function calculateStatus(daysLeft, currentStatus) {
  if (currentStatus === 'transferred' || currentStatus === 'cancelled' || currentStatus === 'suspended') {
    return currentStatus;
  }
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'active';
}

function addMonthsToDate(dateStr, months = 12) {
  const currentExp = new Date(dateStr);
  const baseDate = currentExp < new Date() ? new Date() : currentExp;
  baseDate.setMonth(baseDate.getMonth() + months);
  return baseDate.toISOString().split('T')[0];
}

function addYearsToDate(dateStr, years = 1) {
  return addMonthsToDate(dateStr, years * 12);
}

function countByExpiryWindow(items = []) {
  let expired = 0;
  let expiring7 = 0;
  let expiring15 = 0;
  let expiring30 = 0;

  items.forEach(item => {
    const days = item.days_remaining;
    if (days < 0) expired++;
    else if (days <= 7) expiring7++;
    else if (days <= 15) expiring15++;
    else if (days <= EXPIRING_SOON_DAYS) expiring30++;
  });

  return { expired, expiring7, expiring15, expiring30 };
}

module.exports = {
  EXPIRING_SOON_DAYS,
  calculateStatus,
  addMonthsToDate,
  addYearsToDate,
  countByExpiryWindow
};
