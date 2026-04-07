import { useState, useRef, useEffect, useCallback } from 'react';

export function usePanZoom({ initialCenterX = 1950, initialZoom = 15, initialPanY = 0, initialLaneHeight = 160, minLaneHeight = 60 }) {
  const containerRef = useRef(null);
  const stageXRef = useRef(null);
  const stageEventsXRef = useRef(null);
  const stageYRef = useRef(null);

  const [viewState, setViewState] = useState({ centerX: initialCenterX, zoom: initialZoom, panY: initialPanY, laneHeight: initialLaneHeight });

  const isPanning = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPanY = useRef(initialPanY);
  const isAltPressedRef = useRef(false);

  useEffect(() => {
    setViewState(prev => prev.laneHeight < minLaneHeight ? { ...prev, laneHeight: minLaneHeight } : prev);
  }, [minLaneHeight]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Alt') isAltPressedRef.current = true; };
    const handleKeyUp = (e) => { if (e.key === 'Alt') isAltPressedRef.current = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getPoint = useCallback((e) => {
    if (e.touches?.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches?.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseDown = useCallback((e, preventPan = false) => {
    if ((e.type.includes('mouse') && e.button !== 0) || preventPan || isAltPressedRef.current) return;
    isPanning.current = true;
    startPos.current = getPoint(e);
    [stageXRef, stageEventsXRef, stageYRef].forEach(ref => {
      if (ref.current) ref.current.style.transition = 'none';
    });
  }, [getPoint]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const pos = getPoint(e);
    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;

    if (stageXRef.current) stageXRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (stageEventsXRef.current) stageEventsXRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (stageYRef.current) stageYRef.current.style.transform = `translate3d(0, ${currentPanY.current + dy}px, 0)`;
  }, [getPoint]);

  const handleMouseUp = useCallback((e) => {
    if (!isPanning.current) return;
    isPanning.current = false;
    
    const pos = getPoint(e);
    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;

    // クリック等の微小な移動の場合は状態を更新せず、DOMのtransformをリセットする
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      [stageXRef, stageEventsXRef].forEach(ref => {
        if (ref.current) ref.current.style.transform = `translate3d(0, 0, 0)`;
      });
      if (stageYRef.current) {
        stageYRef.current.style.transform = `translate3d(0, ${currentPanY.current}px, 0)`;
      }
      return;
    }

    // 状態更新関数（setViewState）の外で計算と副作用を完結させる
    const newPanY = currentPanY.current + dy;
    currentPanY.current = newPanY;

    setViewState(prev => ({
      ...prev,
      centerX: prev.centerX - (dx / prev.zoom),
      panY: newPanY
    }));

    [stageXRef, stageEventsXRef].forEach(ref => {
      if (ref.current) ref.current.style.transform = `translate3d(0, 0, 0)`;
    });
    if (stageYRef.current) {
      stageYRef.current.style.transform = `translate3d(0, ${newPanY}px, 0)`;
    }
  }, [getPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      
      setViewState(prev => {
        if (e.ctrlKey || e.metaKey) {
          return { ...prev, laneHeight: Math.min(Math.max(prev.laneHeight * factor, minLaneHeight), 600) };
        }
        return { ...prev, zoom: Math.min(Math.max(prev.zoom * factor, 0.1), 3000) };
      });
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [minLaneHeight]);

  return { viewState, containerRef, stageXRef, stageEventsXRef, stageYRef, isPanning, handleMouseDown, handleMouseMove, handleMouseUp };
}