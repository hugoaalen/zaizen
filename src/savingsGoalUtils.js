export const getMonthsUntil = (targetDate, today = new Date()) => {
  const target = new Date(`${targetDate}T00:00:00`)
  if (Number.isNaN(target.getTime()) || target <= today) return 0

  const monthDifference =
    (target.getFullYear() - today.getFullYear()) * 12 +
    target.getMonth() - today.getMonth()

  return Math.max(1, monthDifference + (target.getDate() > today.getDate() ? 1 : 0))
}

export const getGoalProgress = (goal, today = new Date()) => {
  const target = Number(goal.target_amount)
  const saved = (goal.savings_contributions || [])
    .reduce((sum, contribution) => sum + Number(contribution.amount), 0)
  const remaining = Math.max(0, target - saved)
  const percentage = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
  const monthsRemaining = getMonthsUntil(goal.target_date, today)
  const monthlyRecommended = monthsRemaining > 0 ? remaining / monthsRemaining : remaining
  const completed = saved >= target
  const overdue = !completed && new Date(`${goal.target_date}T23:59:59`) < today

  return { target, saved, remaining, percentage, monthsRemaining, monthlyRecommended, completed, overdue }
}
