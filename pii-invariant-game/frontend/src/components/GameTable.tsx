import type { Question, PiiQuestion, InvariantQuestion, CellState } from '../types';

interface GameTableProps {
  questions: Question[];
  answers: Map<string, { state: CellState; points: number }>;
  onCellClick: (board: 'PII' | 'INVARIANT', externalId: string, field: string, value: string) => void;
  disabled?: boolean;
}

export function GameTable({ questions, answers, onCellClick, disabled = false }: GameTableProps) {
  const piiQuestions = questions.filter((q): q is PiiQuestion => q.board === 'PII');
  const invariantQuestions = questions.filter((q): q is InvariantQuestion => q.board === 'INVARIANT');

  return (
    <div className="boards">
      {/* PII Table */}
      <section className="board-card">
        <BoardTitle
          accent="blue"
          title="Bảng A: Phát hiện rò rỉ PII (Thông tin cá nhân)"
          description="Click vào các ô chứa thông tin cá nhân chưa được che (Email, SĐT, Địa chỉ) trong cột Ghi chú hoặc Hướng dẫn giao hàng."
        />
        <PiiTable
          questions={piiQuestions}
          answers={answers}
          onCellClick={onCellClick}
          disabled={disabled}
        />
      </section>

      {/* Invariant Table */}
      <section className="board-card">
        <BoardTitle
          accent="green"
          title="Bảng B: Kiểm tra quy tắc dữ liệu (Invariant)"
          description="Click vào các ô vi phạm quy tắc: totalPrice = items + tax + shipping, và tax >= 0."
        />
        <InvariantTable
          questions={invariantQuestions}
          answers={answers}
          onCellClick={onCellClick}
          disabled={disabled}
        />
      </section>
    </div>
  );
}

interface BoardTitleProps {
  accent: 'blue' | 'green';
  title: string;
  description: string;
}

function BoardTitle({ accent, title, description }: BoardTitleProps) {
  return (
    <header className={`board-title board-title-${accent}`}>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

interface PiiTableProps {
  questions: PiiQuestion[];
  answers: Map<string, { state: CellState; points: number }>;
  onCellClick: (board: 'PII' | 'INVARIANT', externalId: string, field: string, value: string) => void;
  disabled: boolean;
}

function PiiTable({ questions, answers, onCellClick, disabled }: PiiTableProps) {
  const handleCellClick = (externalId: string, field: string, value: string | null) => {
    if (!value || value === '-' || value.startsWith('*') || value === '') return;
    const key = `PII:${externalId}:${field}`;
    const answer = answers.get(key);
    if (answer) return; // Already answered
    onCellClick('PII', externalId, field, value);
  };

  const getCellState = (externalId: string, field: string): CellState | null => {
    const key = `PII:${externalId}:${field}`;
    return answers.get(key)?.state || null;
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>HỌ TÊN</th>
            <th>EMAIL</th>
            <th>ĐIỆN THOẠI</th>
            <th>ĐỊA CHỈ</th>
            <th>GHI CHÚ</th>
            <th>HƯỚNG DẪN GIAO HÀNG</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((row) => (
            <tr key={row.externalId}>
              <td className="cell-id">{row.externalId}</td>
              <td>{row.fullName || '-'}</td>
              <td>{row.email || '-'}</td>
              <td>{row.phone || '-'}</td>
              <td>{row.address || '-'}</td>
              <Cell
                value={row.notes}
                state={getCellState(row.externalId, 'notes')}
                onClick={() => handleCellClick(row.externalId, 'notes', row.notes)}
                disabled={disabled}
              />
              <Cell
                value={row.shipping}
                state={getCellState(row.externalId, 'shipping')}
                onClick={() => handleCellClick(row.externalId, 'shipping', row.shipping)}
                disabled={disabled}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface InvariantTableProps {
  questions: InvariantQuestion[];
  answers: Map<string, { state: CellState; points: number }>;
  onCellClick: (board: 'PII' | 'INVARIANT', externalId: string, field: string, value: string) => void;
  disabled: boolean;
}

function InvariantTable({ questions, answers, onCellClick, disabled }: InvariantTableProps) {
  const handleCellClick = (externalId: string, field: string, value: string) => {
    const key = `INVARIANT:${externalId}:${field}`;
    const answer = answers.get(key);
    if (answer) return;
    onCellClick('INVARIANT', externalId, field, value);
  };

  const getCellState = (externalId: string, field: string): CellState | null => {
    const key = `INVARIANT:${externalId}:${field}`;
    return answers.get(key)?.state || null;
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ITEMS ($)</th>
            <th>TAX ($)</th>
            <th>SHIPPING ($)</th>
            <th>TOTAL PRICE ($)</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((row) => (
            <tr key={row.externalId}>
              <td className="cell-id">{row.externalId}</td>
              <td>{row.items}</td>
              <Cell
                value={row.tax}
                state={getCellState(row.externalId, 'tax')}
                onClick={() => handleCellClick(row.externalId, 'tax', row.tax)}
                disabled={disabled}
              />
              <td>{row.shipping}</td>
              <Cell
                value={row.totalPrice}
                state={getCellState(row.externalId, 'totalPrice')}
                onClick={() => handleCellClick(row.externalId, 'totalPrice', row.totalPrice)}
                disabled={disabled}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CellProps {
  value: string | null;
  state: CellState | null;
  onClick: () => void;
  disabled: boolean;
}

function Cell({ value, state, onClick, disabled }: CellProps) {
  if (!value || value === '-' || value === '') {
    return <td>{value || '-'}</td>;
  }

  const isMasked = value.startsWith('*') || value.startsWith('09*') || value === '-';

  let className = 'cell-clickable';
  if (state === 'correct') className = 'cell-correct';
  else if (state === 'wrong') className = 'cell-wrong';
  else if (isMasked) className = 'cell-masked';

  const isClickable = !disabled && !state && !isMasked;

  return (
    <td
      className={className}
      onClick={isClickable ? onClick : undefined}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      {value}
    </td>
  );
}
