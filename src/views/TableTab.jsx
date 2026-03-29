import React from 'react';

export default function TableTab({ events }) {
  // 日付順に並び替えて表示（新しい順）
  const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: '#fff',
  };

  const thStyle = {
    borderBottom: '2px solid #333',
    padding: '12px 8px',
    textAlign: 'left',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
  };

  const tdStyle = {
    borderBottom: '1px solid #eee',
    padding: '10px 8px',
    fontSize: '13px',
    verticalAlign: 'top',
  };

  const tagStyle = {
    display: 'inline-block',
    background: '#eee',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    marginRight: '4px',
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <h2>イベント一覧（{events.length}件）</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '100px' }}>日付</th>
            <th style={{ ...thStyle, width: '150px' }}>タイトル</th>
            <th style={thStyle}>説明 / #タグ</th>
            <th style={{ ...thStyle, width: '80px' }}>画像</th>
          </tr>
        </thead>
        <tbody>
          {sortedEvents.map((event) => (
            <tr key={event.id}>
              <td style={tdStyle}>
                <strong>{event.date}</strong>
              </td>
              <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                {event.title || '(無題)'}
              </td>
              <td style={tdStyle}>
                <div style={{ marginBottom: '5px' }}>{event.description}</div>
                <div>
                  {event.tags?.map((tag) => (
                    <span key={tag} style={tagStyle}>#{tag}</span>
                  ))}
                </div>
              </td>
              <td style={tdStyle}>
                {event.image ? (
                  <span style={{ color: 'green', fontSize: '11px' }}>あり</span>
                ) : (
                  <span style={{ color: '#ccc', fontSize: '11px' }}>なし</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          イベントが登録されていません。年表タブでダブルクリックして追加してください。
        </div>
      )}
    </div>
  );
}