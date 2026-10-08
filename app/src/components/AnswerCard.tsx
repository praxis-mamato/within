import { Link } from 'react-router-dom';
import type { Answer } from '../content/answer';

/** The fuller answer to a sky or feeling question, built on the device from the person's chart. */
export function AnswerCard({ answer }: { answer: Answer }) {
  return (
    <section className="card answer-card" aria-labelledby="answer-h">
      <div className="lens-label">
        <span className="dot" aria-hidden="true" />
        From your chart and today’s sky
      </div>
      <h2 id="answer-h" style={{ marginTop: 0 }}>
        {answer.title}
      </h2>
      <p className="small muted">{answer.intro}</p>
      <div className="reading-items">
        {answer.sections.map((s) => (
          <article key={s.id} className="reading-item">
            <h3>{s.title}</h3>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.points && s.points.length > 0 && (
              <ul className="answer-points">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {s.basis && <p className="basis">{s.basis}</p>}
          </article>
        ))}
      </div>
      {answer.care && <p className="small muted answer-care">{answer.care}</p>}
      <Link className="link small" to="/you/cycles">
        See all your cycles and their dates
      </Link>
    </section>
  );
}
