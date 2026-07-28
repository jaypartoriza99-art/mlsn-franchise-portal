export const chartCardStyle = {
  background: '#ffffff',
  border: '1px solid #e7eaf0',
  borderRadius: '18px',
  padding: '20px',
  minHeight: '330px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
}

export const chartTitleStyle = {
  margin: 0,
  color: '#172033',
  fontSize: '17px',
  fontWeight: 700,
}

export const chartSubtitleStyle = {
  margin: '6px 0 18px',
  color: '#667085',
  fontSize: '13px',
}

export function EmptyChart({ message = 'No analytics data available yet.' }) {
  return (
    <div
      style={{
        height: '230px',
        display: 'grid',
        placeItems: 'center',
        color: '#98a2b3',
        fontSize: '14px',
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}
