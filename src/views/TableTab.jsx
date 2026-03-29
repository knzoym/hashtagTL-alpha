export default function TableTab({ events }) {
  return (
    <div>
      <h2>テーブル</h2>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>日付</th>
            <th>タイトル</th>
            <th>タグ</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.id}</td>
              <td>{event.date}</td>
              <td>{event.title}</td>
              <td>{event.tags.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}