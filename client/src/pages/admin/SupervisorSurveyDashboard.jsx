import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function SupervisorSurveyDashboard() {
  const [surveys, setSurveys] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [ratingFilter, setRatingFilter] = useState('All')

  useEffect(() => {
    fetchSurveys()

    const channel = supabase
      .channel('supervisor-survey-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_satisfaction_surveys',
        },
        () => {
          fetchSurveys()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchSurveys() {
    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('ticket_satisfaction_surveys')
      .select(`
        id,
        rating,
        feedback,
        created_at,
        ticket_id,
        franchisee_id,
        assigned_to,
        tickets:ticket_id (
          ticket_number,
          subject,
          category,
          status
        ),
        franchisee:franchisee_id (
          full_name,
          email
        ),
        agent:assigned_to (
          full_name,
          email
        )
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading satisfaction surveys:',
        error
      )
      setErrorMessage(error.message)
      setSurveys([])
      setIsLoading(false)
      return
    }

    setSurveys(data || [])
    setIsLoading(false)
  }

  const analytics = useMemo(() => {
    const total = surveys.length

    const average =
      total === 0
        ? 0
        : surveys.reduce(
            (sum, survey) =>
              sum + Number(survey.rating || 0),
            0
          ) / total

    const satisfiedCount = surveys.filter(
      (survey) => survey.rating >= 4
    ).length

    const lowRatingCount = surveys.filter(
      (survey) => survey.rating <= 2
    ).length

    const fiveStarCount = surveys.filter(
      (survey) => survey.rating === 5
    ).length

    return {
      total,
      average,
      satisfactionRate:
        total === 0
          ? 0
          : (satisfiedCount / total) * 100,
      lowRatingCount,
      fiveStarRate:
        total === 0
          ? 0
          : (fiveStarCount / total) * 100,
    }
  }, [surveys])

  const agentPerformance = useMemo(() => {
    const grouped = new Map()

    surveys.forEach((survey) => {
      const key =
        survey.assigned_to || 'unassigned'

      const name =
        survey.agent?.full_name ||
        survey.agent?.email ||
        'Unassigned'

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name,
          totalRating: 0,
          surveyCount: 0,
          lowRatings: 0,
        })
      }

      const current = grouped.get(key)

      current.totalRating += Number(
        survey.rating || 0
      )
      current.surveyCount += 1

      if (survey.rating <= 2) {
        current.lowRatings += 1
      }
    })

    return Array.from(grouped.values())
      .map((agent) => ({
        ...agent,
        averageRating:
          agent.surveyCount === 0
            ? 0
            : agent.totalRating /
              agent.surveyCount,
      }))
      .sort(
        (a, b) =>
          b.averageRating -
          a.averageRating
      )
  }, [surveys])

  const filteredSurveys = useMemo(() => {
    if (ratingFilter === 'All') {
      return surveys
    }

    return surveys.filter(
      (survey) =>
        survey.rating ===
        Number(ratingFilter)
    )
  }, [surveys, ratingFilter])

  return (
    <>
      <div className="page-header">
        <h1>Survey Analytics</h1>
        <p>
          Review franchisee satisfaction,
          feedback, and Customer Service
          performance.
        </p>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="survey-dashboard-stats">
        <div className="survey-stat-card">
          <span className="survey-stat-icon">
            ⭐
          </span>
          <div>
            <small>Average Rating</small>
            <h2>
              {analytics.average.toFixed(1)}
              /5
            </h2>
          </div>
        </div>

        <div className="survey-stat-card">
          <span className="survey-stat-icon">
            📝
          </span>
          <div>
            <small>Total Surveys</small>
            <h2>{analytics.total}</h2>
          </div>
        </div>

        <div className="survey-stat-card">
          <span className="survey-stat-icon">
            😊
          </span>
          <div>
            <small>Satisfaction Rate</small>
            <h2>
              {analytics.satisfactionRate.toFixed(
                0
              )}
              %
            </h2>
          </div>
        </div>

        <div className="survey-stat-card">
          <span className="survey-stat-icon">
            ⚠️
          </span>
          <div>
            <small>Low Ratings</small>
            <h2>
              {analytics.lowRatingCount}
            </h2>
          </div>
        </div>
      </div>

      <div className="survey-dashboard-grid">
        <section className="survey-dashboard-card">
          <div className="survey-section-header">
            <div>
              <h2>
                Customer Service Performance
              </h2>
              <p>
                Average rating per assigned
                representative.
              </p>
            </div>
          </div>

          {agentPerformance.length === 0 ? (
            <p>No survey data yet.</p>
          ) : (
            <div className="survey-agent-list">
              {agentPerformance.map(
                (agent, index) => (
                  <div
                    className="survey-agent-row"
                    key={agent.id}
                  >
                    <div>
                      <strong>
                        {index === 0
                          ? '🏆 '
                          : ''}
                        {agent.name}
                      </strong>
                      <small>
                        {agent.surveyCount}{' '}
                        survey
                        {agent.surveyCount !== 1
                          ? 's'
                          : ''}
                      </small>
                    </div>

                    <div className="survey-agent-score">
                      <strong>
                        {agent.averageRating.toFixed(
                          1
                        )}
                        /5
                      </strong>

                      {agent.lowRatings > 0 && (
                        <small className="survey-low-rating-text">
                          {agent.lowRatings} low
                          rating
                          {agent.lowRatings !== 1
                            ? 's'
                            : ''}
                        </small>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="survey-dashboard-card">
          <h2>Rating Summary</h2>

          {[5, 4, 3, 2, 1].map(
            (rating) => {
              const count = surveys.filter(
                (survey) =>
                  survey.rating === rating
              ).length

              const percentage =
                surveys.length === 0
                  ? 0
                  : (count /
                      surveys.length) *
                    100

              return (
                <div
                  className="survey-rating-row"
                  key={rating}
                >
                  <span>
                    {rating} ★
                  </span>

                  <div className="survey-rating-bar">
                    <div
                      className="survey-rating-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <strong>{count}</strong>
                </div>
              )
            }
          )}

          <p className="survey-five-star-rate">
            Five-star rate:{' '}
            <strong>
              {analytics.fiveStarRate.toFixed(
                0
              )}
              %
            </strong>
          </p>
        </section>
      </div>

      <section className="survey-dashboard-card">
        <div className="survey-section-header">
          <div>
            <h2>Recent Feedback</h2>
            <p>
              Latest survey responses from
              franchisees.
            </p>
          </div>

          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Ratings
            </option>
            <option value="5">
              5 Stars
            </option>
            <option value="4">
              4 Stars
            </option>
            <option value="3">
              3 Stars
            </option>
            <option value="2">
              2 Stars
            </option>
            <option value="1">
              1 Star
            </option>
          </select>
        </div>

        {isLoading ? (
          <p>Loading survey analytics...</p>
        ) : filteredSurveys.length === 0 ? (
          <p>No survey responses found.</p>
        ) : (
          <div className="survey-table-wrapper">
            <table className="survey-feedback-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Franchisee</th>
                  <th>Handled By</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {filteredSurveys.map(
                  (survey) => (
                    <tr key={survey.id}>
                      <td>
                        <strong>
                          {survey.tickets
                            ?.ticket_number ||
                            'N/A'}
                        </strong>
                        <small>
                          {survey.tickets
                            ?.subject || ''}
                        </small>
                      </td>

                      <td>
                        {survey.franchisee
                          ?.full_name ||
                          survey.franchisee
                            ?.email ||
                          'Unknown'}
                      </td>

                      <td>
                        {survey.agent
                          ?.full_name ||
                          survey.agent?.email ||
                          'Unassigned'}
                      </td>

                      <td>
                        <span
                          className={`survey-table-rating ${
                            survey.rating <= 2
                              ? 'low'
                              : ''
                          }`}
                        >
                          {renderStars(
                            survey.rating
                          )}
                        </span>
                      </td>

                      <td>
                        {survey.feedback ||
                          'No comment provided.'}
                      </td>

                      <td>
                        {new Date(
                          survey.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

export default SupervisorSurveyDashboard