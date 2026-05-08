export const DISTRIBUTION_LEVELS = [
  {
    id: 'bronze',
    name: '铜牌推广员',
    firstYearCommission: 0.20,
    renewalCommission: 0.05,
    minWithdraw: 50,
    requiredReferrals: 0,
    color: '#cd7f32'
  },
  {
    id: 'silver',
    name: '银牌推广员',
    firstYearCommission: 0.25,
    renewalCommission: 0.05,
    minWithdraw: 50,
    requiredReferrals: 5,
    color: '#c0c0c0'
  },
  {
    id: 'gold',
    name: '金牌推广员',
    firstYearCommission: 0.30,
    renewalCommission: 0.08,
    minWithdraw: 50,
    requiredReferrals: 20,
    color: '#ffd700'
  }
];

export function getDistributionLevel(totalReferrals) {
  if (totalReferrals >= 20) return DISTRIBUTION_LEVELS[2];
  if (totalReferrals >= 5) return DISTRIBUTION_LEVELS[1];
  return DISTRIBUTION_LEVELS[0];
}

export function calculateCommission(level, amount, isRenewal = false) {
  const rate = isRenewal ? level.renewalCommission : level.firstYearCommission;
  return Math.round(amount * rate * 100) / 100;
}

export function generateReferralLink(userId, baseUrl = window.location.origin) {
  const code = btoa(String(userId)).replace(/=/g, '').slice(0, 8);
  return `${baseUrl}?ref=${code}`;
}
