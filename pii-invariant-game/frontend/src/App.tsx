import { useState } from 'react'
import './App.css'

type Group = {
  id: string
  status: 'locked' | 'available'
  icon: string
}

type PiiRow = {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  notes: string
  shipping: string
  notesState?: 'correct' | 'wrong'
  shippingState?: 'correct' | 'wrong'
}

type InvariantRow = {
  id: string
  items: string
  tax: string
  shipping: string
  totalPrice: string
}

const groups: Group[] = [
  { id: 'Group01', status: 'locked', icon: 'lock' },
  { id: 'Group02', status: 'available', icon: 'shield' },
  { id: 'Group03', status: 'available', icon: 'users' },
  { id: 'Group04', status: 'available', icon: 'card' },
  { id: 'Group05', status: 'locked', icon: 'lock' },
  { id: 'Group06', status: 'available', icon: 'shield' },
  { id: 'Group07', status: 'available', icon: 'layers' },
  { id: 'Group08', status: 'available', icon: 'target' },
]

const piiRows: PiiRow[] = [
  {
    id: '#001',
    fullName: '-',
    email: '-',
    phone: '09******88',
    address: 'P. 10, Tân An',
    notes: 'Giao cho anh Nam',
    shipping: 'Giao trong giờ hành chính',
    notesState: 'correct',
  },
  {
    id: '#002',
    fullName: '-',
    email: '-',
    phone: '09******60',
    address: '123 Lê Lợi',
    notes: 'Hàng dễ vỡ',
    shipping: 'Đặt trước cửa nhà',
  },
  {
    id: '#003',
    fullName: '-',
    email: 'cuong.lh@host',
    phone: '09******77',
    address: 'P10, Central',
    notes: 'Khách hàng VIP',
    shipping: 'Gọi cho Minh: 098...',
    notesState: 'wrong',
  },
  {
    id: '#004',
    fullName: 'PHAN ANH DUNG',
    email: '-',
    phone: '09******66',
    address: '789 Nguyễn Huệ',
    notes: 'Chung cư cao cấp',
    shipping: 'Nhà số 12, hẻm 45',
  },
  {
    id: '#005',
    fullName: '-',
    email: '-',
    phone: '09******22',
    address: '321 Phan Xích Long',
    notes: 'Gửi bảo vệ tầng hầm',
    shipping: 'Người nhận: Hoàng Thị Em',
  },
]

const invariantRows: InvariantRow[] = [
  { id: '#INV-01', items: '150.00', tax: '15.00', shipping: '5.00', totalPrice: '170.00' },
  { id: '#INV-02', items: '200.00', tax: '-10.00', shipping: '0.00', totalPrice: '190.00' },
]

function App() {
  const [selectedGroup, setSelectedGroup] = useState('Group01')
  const [screen, setScreen] = useState<'login' | 'game'>('login')

  const handleGroupClick = (group: Group) => {
    if (group.status === 'locked') return
    setSelectedGroup(group.id)
    setScreen('game')
  }

  return (
    <main className="app-shell">
      {screen === 'login' ? (
        <LoginScreen onGroupClick={handleGroupClick} />
      ) : (
        <GameScreen groupId={selectedGroup} onBack={() => setScreen('login')} />
      )}
    </main>
  )
}

function LoginScreen({ onGroupClick }: { onGroupClick: (group: Group) => void }) {
  return (
    <section className="login-screen" aria-labelledby="login-title">
      <div className="brand-block">
        <div className="brand-mark">
          <span></span>
        </div>
        <h1 id="login-title">PII SENTINEL</h1>
        <p>CHỌN NHÓM CỦA BẠN</p>
      </div>

      <div className="group-grid" aria-label="Danh sách nhóm">
        {groups.map((group) => (
          <button
            className={`group-card ${group.status === 'locked' ? 'is-locked' : ''}`}
            disabled={group.status === 'locked'}
            key={group.id}
            onClick={() => onGroupClick(group)}
            type="button"
          >
            <Icon name={group.icon} />
            <strong>{group.id}</strong>
            <span>{group.status === 'locked' ? 'ĐANG CHƠI' : 'SẴN SÀNG'}</span>
          </button>
        ))}
      </div>

      <aside className="login-note">
        <Icon name="info" />
        <span>
          Lưu ý: Mỗi nhóm chỉ được đăng nhập trên một thiết bị duy nhất. Sau khi chọn,
          nhóm sẽ bị khóa để đảm bảo tính công bằng. Vui lòng xác nhận trước khi truy cập.
        </span>
      </aside>

      <div className="login-meta">
        <span>STATUS: WAITING_FOR_AUTH</span>
        <span>PROTOCOL: PII_SENTINEL_V3</span>
        <span>SESSION: 2026_JUL_15</span>
      </div>
    </section>
  )
}

function GameScreen({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  return (
    <section className="game-screen" aria-labelledby="game-title">
      <div className="game-content">
        <header className="game-header">
          <button className="game-brand" onClick={onBack} type="button">
            <div className="brand-mark brand-mark-small">
              <span></span>
            </div>
            <div>
              <strong>PII SENTINEL</strong>
              <span>STUDENT AREA</span>
            </div>
          </button>

          <div>
            <span>ĐỘI THI</span>
            <strong>{groupId}</strong>
          </div>
          <div className="timer-pill">
            <Icon name="timer" />
            09:45
          </div>
          <div className="score-pill">
            <span>Tổng điểm</span>
            <strong>+4</strong>
          </div>
        </header>

        <div className="boards" id="monitoring">
          <section className="board-card">
            <BoardTitle
              accent="blue"
              title="Bảng A: Phát hiện rò rỉ PII (Thông tin cá nhân)"
              description="Click vào các ô chứa thông tin cá nhân chưa được che (Full Name, Email, SĐT, Địa chỉ) trong cột Ghi chú hoặc Hướng dẫn giao hàng."
            />
            <div className="result-badges" aria-label="Kết quả bảng A">
              <span className="badge-correct">HIT +2</span>
              <span className="badge-wrong">MISS -1</span>
            </div>
            <DataTable variant="pii" />
          </section>

          <section className="board-card">
            <BoardTitle
              accent="green"
              title="Bảng B: Kiểm tra quy tắc dữ liệu (Invariant)"
              description="Click vào các ô vi phạm quy tắc: totalPrice = items + tax + shipping, và tax >= 0."
            />
            <DataTable variant="invariant" />
          </section>
        </div>

        <footer className="game-footer">
          <span>© 2026 PII Sentinel Security Solutions</span>
          <div>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </footer>

        <button className="submit-button" type="button">
          NỘP BÀI <span>›</span>
        </button>
      </div>
    </section>
  )
}

function BoardTitle({
  accent,
  title,
  description,
}: {
  accent: 'blue' | 'green'
  title: string
  description: string
}) {
  return (
    <header className={`board-title board-title-${accent}`}>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  )
}

function DataTable({ variant }: { variant: 'pii' | 'invariant' }) {
  if (variant === 'invariant') {
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
            {invariantRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.items}</td>
                <td>{row.tax}</td>
                <td>{row.shipping}</td>
                <td>{row.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

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
          {piiRows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.fullName}</td>
              <td>{row.email}</td>
              <td>{row.phone}</td>
              <td>{row.address}</td>
              <td className={row.notesState ? `cell-${row.notesState}` : ''}>{row.notes}</td>
              <td className={row.shippingState ? `cell-${row.shippingState}` : ''}>
                {row.shipping}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Icon({ name }: { name: string }) {
  return <span className={`icon icon-${name}`} aria-hidden="true"></span>
}

export default App
