import { useEffect, useState } from 'react';
import { adminError, fetchIncidentAnalytics } from '../../api/admin';

const PERIODS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

function bucketLabel(start, period) {
  const date = new Date(`${start}T00:00:00Z`);
  if (period === 'year') return new Intl.DateTimeFormat(undefined, { year: 'numeric', timeZone: 'UTC' }).format(date);
  if (period === 'month') return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('day');
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setAnalytics(null);
    fetchIncidentAnalytics(period)
      .then((result) => { if (active) { setAnalytics(result); setError(''); } })
      .catch((err) => { if (active) setError(adminError(err, 'Could not load incident analytics.')); });
    return () => { active = false; };
  }, [period]);

  const maximum = Math.max(1, ...(analytics?.buckets?.map((bucket) => bucket.count) || []));
  const average = analytics ? (analytics.total / analytics.buckets.length).toFixed(1) : '—';
  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Incident intelligence</p><h1 className="rescue-page-title">Incident analytics</h1><p className="rescue-page-lede">Track how many emergency requests were created each day, week, month, or year.</p></div></div>
      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-card admin-analytics">
        <div className="admin-analytics__top"><div><p className="rescue-eyebrow">Selected period</p><h2>{analytics?.total ?? '—'} incidents</h2><p className="rescue-empty-note">Average {average} per {period} · Counted by request creation date (UTC)</p></div><div className="admin-periods" role="group" aria-label="Analytics time period">{PERIODS.map((item) => <button key={item.value} type="button" className={period === item.value ? 'admin-periods__active' : ''} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div></div>
        {analytics ? (
          <div className="admin-chart" role="img" aria-label={`${analytics.total} incidents across ${analytics.buckets.length} ${period} periods`}>
            {analytics.buckets.map((bucket) => <div className="admin-chart__column" key={bucket.start}><strong>{bucket.count}</strong><div className="admin-chart__track"><div className="admin-chart__bar" style={{ height: `${bucket.count ? Math.max(4, bucket.count / maximum * 100) : 0}%` }} /></div><span>{bucketLabel(bucket.start, period)}</span></div>)}
          </div>
        ) : <p className="rescue-empty-note admin-empty">Loading analytics…</p>}
        {analytics && <div className="admin-analytics__rows"><h3>Exact counts</h3><div>{analytics.buckets.map((bucket) => <span key={bucket.start}>{bucketLabel(bucket.start, period)}: <strong>{bucket.count}</strong></span>)}</div></div>}
      </section>
    </>
  );
}
