import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { isEventInTimeline } from '../utils/laneUtils';
import EventModal from '../components/EventModal';

export default function TableTab() {
  const { currentFileId, events, files, focusedLaneId, handleRestoreEvent } = useAppStore();
  const [editingEvent, setEditingEvent] = useState(null);

  const currentFile = files.find(f => f.id === currentFileId);
  const timelines = currentFile?.timelines || [];
  const displayEvents = currentFileId ? events.filter(e => e.fileId === currentFileId) : events;

  const targetTimeline = timelines.find(t => t.id === focusedLaneId);

  const tableEvents = displayEvents.filter(event => {
    if (!targetTimeline) return true;
    return isEventInTimeline(event, targetTimeline) || targetTimeline.excludedEventIds.includes(event.id);
  });

  const getStatus = (event) => {
    if (!targetTimeline) return '';
    if (targetTimeline.excludedEventIds.includes(event.id)) return '仮削除';
    if (targetTimeline.includedEventIds.includes(event.id)) return '仮登録';
    return '自動登録';
  };

  return (
    <div style={{ padding: '120px 25px 25px', height: '100%', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: '#f2f2f2' }}>
      
      {/* ★ 年表の構成条件を表示するヘッダー */}
      {targetTimeline && (
        <div style={{ marginBottom: '15px', padding: '15px', background: '#fff', borderRadius: '8px', border: `2px solid ${targetTimeline.color || '#ccc'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>年表の構成条件（自動抽出）</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {targetTimeline.condition?.logic || 'OR'}
            </span>
            {targetTimeline.condition?.tags?.map((tag, i) => (
              <span key={i} style={{ background: '#eee', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #ccc' }}>
                {tag.text || tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#1a365d', color: '#fff' }}>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'left', width: '120px' }}>日付</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>タイトル</th>
            <th style={{ padding: '12px 16px', textAlign: 'left' }}>タグ</th>
            {targetTimeline && <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>年表ステータス</th>}
            <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {tableEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => {
            const status = getStatus(event);
            const isExcluded = status === '仮削除';
            
            return (
              <tr 
                key={event.id} 
                style={{ borderBottom: '1px solid #eee', opacity: isExcluded ? 0.4 : 1, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f9ff'} 
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: '#555' }}>{event.date}</td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{event.title || '(無題)'}</td>
                <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>
                  {(event.tags || []).map(t => (
                    <span key={t} style={{ display: 'inline-block', background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', marginRight: '6px', marginBottom: '4px' }}>
                      {t}
                    </span>
                  ))}
                </td>
                {targetTimeline && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', width: '70px',
                      backgroundColor: isExcluded ? '#ffcccc' : status === '仮登録' ? '#ccffcc' : '#eee',
                      color: isExcluded ? '#cc0000' : status === '仮登録' ? '#006600' : '#666'
                    }}>
                      {status}
                    </span>
                  </td>
                )}
                <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setEditingEvent(event)} style={{ padding: '4px 12px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    編集
                  </button>
                  {isExcluded && (
                    <button onClick={() => handleRestoreEvent(event.id, targetTimeline.id)} style={{ padding: '4px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      復元
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {tableEvents.length === 0 && (
            <tr>
              <td colSpan={targetTimeline ? 5 : 4} style={{ padding: '40px', textAlign: 'center', color: '#888', fontWeight: 'bold' }}>
                該当するイベントがありません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {editingEvent && <EventModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
    </div>
  );
}