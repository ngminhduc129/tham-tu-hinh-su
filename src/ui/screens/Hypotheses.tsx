import {
  Badge,
  Button,
  Callout,
  Card,
  HintPanel,
  MultiChoice,
  NoteField,
  SectionHeading,
} from '../components'
import { useGame } from '../GameContext'
import { getValues } from '../../domain/answers'

export function HypothesesScreen() {
  const { caseFile, session, dispatch, lookups, readOnly, navigate } = useGame()
  const supportField = caseFile.answer_fields.find((field) => field.id === 'hypothesis_support')
  const challengeField = caseFile.answer_fields.find((field) => field.id === 'hypothesis_challenge')

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 4 · Giả thuyết"
        title="Hai giả thuyết cạnh tranh"
        description={
          <p>
            Gắn từng nguồn vào vai trò ủng hộ hoặc phản bác. Giữ cả hai giả thuyết cho đến khi có dữ
            kiện độc lập; một nguồn có thể vừa phản bác giả thuyết này vừa cung cấp dữ kiện cho giả
            thuyết kia.
          </p>
        }
      />

      <div className="hypothesis-grid">
        {caseFile.hypotheses.map((hypothesis) => (
          <Card key={hypothesis.id} className="hypothesis-card">
            <div className="chip-row">
              <Badge tone="accent">{hypothesis.id === 'hypothesis_a' ? 'H1' : 'H2'}</Badge>
            </div>
            <h3>{hypothesis.label ?? hypothesis.id}</h3>
            <p>{hypothesis.description}</p>

            {(hypothesis.missing_information ?? []).length > 0 && (
              <div className="missing-box">
                <h4>Dữ kiện còn thiếu</h4>
                <ul className="tight-list">
                  {(hypothesis.missing_information ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {supportField && (
              <MultiChoice
                legend="Chứng cứ ủng hộ"
                hint="Chọn các nguồn thực sự làm giả thuyết này có cơ sở hơn."
                options={supportField.options}
                values={getValues(session.answers, supportField.id, hypothesis.id)}
                readOnly={readOnly}
                onToggle={(value) =>
                  dispatch({
                    type: 'TOGGLE_MULTI',
                    fieldId: supportField.id,
                    targetId: hypothesis.id,
                    value,
                  })
                }
              />
            )}

            {challengeField && (
              <MultiChoice
                legend="Chứng cứ phản bác"
                hint="Chọn các nguồn làm giảm độ tin hoặc mâu thuẫn với giả thuyết."
                options={challengeField.options}
                values={getValues(session.answers, challengeField.id, hypothesis.id)}
                readOnly={readOnly}
                onToggle={(value) =>
                  dispatch({
                    type: 'TOGGLE_MULTI',
                    fieldId: challengeField.id,
                    targetId: hypothesis.id,
                    value,
                  })
                }
              />
            )}

            <NoteField
              label="Ghi chú suy nghĩ (không chấm điểm)"
              value={session.notes[`hypothesis:${hypothesis.id}`] ?? ''}
              readOnly={readOnly}
              rows={2}
              onChange={(value) =>
                dispatch({ type: 'SET_NOTE', key: `hypothesis:${hypothesis.id}`, value })
              }
            />
          </Card>
        ))}
      </div>

      <div className="two-column">
        <Card>
          <h3>So sánh nhanh</h3>
          <p className="muted small">
            Bảng chỉ phản ánh các lựa chọn hiện tại của bạn, không phải đáp án đúng.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Nguồn</th>
                  {caseFile.hypotheses.map((hypothesis) => (
                    <th key={hypothesis.id} scope="col">
                      {hypothesis.id === 'hypothesis_a' ? 'H1' : 'H2'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(supportField?.options ?? []).map((option) => (
                  <tr key={option.id}>
                    <th scope="row">{option.label}</th>
                    {caseFile.hypotheses.map((hypothesis) => {
                      const supports = getValues(
                        session.answers,
                        'hypothesis_support',
                        hypothesis.id,
                      ).includes(option.id)
                      const challenges = getValues(
                        session.answers,
                        'hypothesis_challenge',
                        hypothesis.id,
                      ).includes(option.id)
                      return (
                        <td key={hypothesis.id}>
                          {supports && <span className="tag tag--support">Ủng hộ</span>}
                          {challenges && <span className="tag tag--challenge">Phản bác</span>}
                          {!supports && !challenges && <span className="muted">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="stack">
          <Callout tone="info" title="Tiêu chí học tập">
            <p>
              Điểm được trao cho việc gắn đúng nguồn vào đúng vai trò, không dựa trên việc chọn giả
              thuyết “có vẻ đúng”. Chỉ các nguồn trọng tâm trong bảng mới được chấm.
            </p>
          </Callout>
          <Card>
            <h3>Nguồn đang dùng</h3>
            <ul className="tight-list">
              {(supportField?.options ?? []).map((option) => (
                <li key={option.id}>
                  <strong>{option.label}</strong>
                  <p className="small muted">
                    {lookups.evidence.get(option.id)?.summary}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
          <HintPanel />
        </div>
      </div>

      <div className="screen-actions">
        <Button
          variant="secondary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/evidence`)}
        >
          ← Quay lại bảng chứng cứ
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/proof`)}
        >
          Ma trận chứng minh
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/analysis`)}
        >
          Sang phân tích pháp lý
        </Button>
      </div>
    </div>
  )
}
