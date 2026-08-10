import React, { useState } from 'react';
import { Calendar as CalendarIcon, Edit3, Sparkles, Check, Heart, Flame, Info, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MenuCalendar({ menuList, onUpdateMenu }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(3); // Default to Thursday (Today)
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [likedMenus, setLikedMenus] = useState({});

  const currentMenu = menuList[selectedDayIndex] || menuList[0];

  const handleEditClick = (menu, index) => {
    setEditFormData({
      index,
      dayName: menu.dayName,
      mainMenu: menu.mainMenu,
      sideMenus: menu.sideMenus.join(', '),
      calories: menu.calories,
      category: menu.category,
      tags: menu.tags.join(', ')
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editFormData) return;

    const updated = [...menuList];
    updated[editFormData.index] = {
      ...updated[editFormData.index],
      mainMenu: editFormData.mainMenu,
      sideMenus: editFormData.sideMenus.split(',').map(s => s.trim()).filter(Boolean),
      calories: editFormData.calories,
      category: editFormData.category,
      tags: editFormData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    onUpdateMenu(updated);
    setIsEditing(false);
    
    // Celebration effect
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const toggleLike = (dayIndex) => {
    setLikedMenus(prev => {
      const next = { ...prev, [dayIndex]: !prev[dayIndex] };
      if (next[dayIndex]) {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="#6366f1" />
            이번 주 급식표 (Meal Menu)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            매일 업데이트되는 영양 급식표 정보입니다. 메뉴를 선택하거나 직접 수정할 수 있습니다.
          </p>
        </div>

        <div className="badge badge-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <Sparkles size={14} />
          영양 가이드 준수 (HACCP)
        </div>
      </div>

      {/* Weekday Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px'
      }}>
        {menuList.map((item, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isToday = item.dayName.includes('오늘');
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`glass-card glass-card-interactive`}
              style={{
                padding: '16px 12px',
                textAlign: 'center',
                border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-card)',
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(30, 41, 59, 0.9) 100%)' 
                  : 'rgba(26, 34, 52, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: isToday ? '#38bdf8' : 'var(--text-muted)', fontWeight: 700 }}>
                {item.date}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                {item.dayName}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {item.mainMenu}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Menu Spotlight Detail Card */}
      {currentMenu && (
        <div className="glass-card" style={{ padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-primary">{currentMenu.dayName}</span>
                <span className="badge badge-warning">{currentMenu.category}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentMenu.date}</span>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                {currentMenu.mainMenu}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => toggleLike(selectedDayIndex)}
                className="btn-secondary"
                style={{
                  color: likedMenus[selectedDayIndex] ? '#ef4444' : 'var(--text-main)',
                  borderColor: likedMenus[selectedDayIndex] ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-card)'
                }}
              >
                <Heart size={16} fill={likedMenus[selectedDayIndex] ? '#ef4444' : 'none'} />
                {likedMenus[selectedDayIndex] ? '좋아요 취소' : '좋아요'}
              </button>

              <button
                onClick={() => handleEditClick(currentMenu, selectedDayIndex)}
                className="btn-primary"
              >
                <Edit3 size={16} />
                급식표 수정
              </button>
            </div>
          </div>

          {/* Side Menus Grid */}
          <div style={{ margin: '24px 0' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              반찬 및 후식 구성
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {currentMenu.sideMenus.map((side, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={14} color="#10b981" />
                  {side}
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Info & Tags */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-card)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Flame size={16} color="#f59e0b" />
                칼로리: <strong style={{ color: '#ffffff' }}>{currentMenu.calories}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {currentMenu.tags.map((tag, idx) => (
                <span key={idx} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Menu Modal */}
      {isEditing && editFormData && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '28px', background: '#131b2e' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} color="#6366f1" />
              {editFormData.dayName} 급식 메뉴 수정
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>메인 메뉴</label>
                <input
                  type="text"
                  value={editFormData.mainMenu}
                  onChange={(e) => setEditFormData({ ...editFormData, mainMenu: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>반찬 및 후식 (쉼표로 구분)</label>
                <textarea
                  rows={3}
                  value={editFormData.sideMenus}
                  onChange={(e) => setEditFormData({ ...editFormData, sideMenus: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>열량 (kcal)</label>
                  <input
                    type="text"
                    value={editFormData.calories}
                    onChange={(e) => setEditFormData({ ...editFormData, calories: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>카테고리</label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>해시태그 (쉼표 구분)</label>
                <input
                  type="text"
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
