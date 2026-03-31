import { useState, useRef, useEffect } from 'react';

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

  // 最新の minLaneHeight を保持
  const minLaneHeightRef = useRef(minLaneHeight);
  useEffect(() => {
    minLaneHeightRef.current = minLaneHeight;
    // 現在の高さが最小値を下回っていたら補正
    setViewState(prev => prev.laneHeight < minLaneHeight ? { ...prev, laneHeight: minLaneHeight } : prev);
  }, [minLaneHeight]);

  useEffect(() => {
    const handleKeyChange = (e) => isAltPressedRef.current = e.altKey;
    window.addEventListener('keydown', handleKeyChange);
    window.addEventListener('keyup', handleKeyChange);
    return () => {
      window.removeEventListener('keydown', handleKeyChange);
      window.removeEventListener('keyup', handleKeyChange);
    };
  }, []);

  const getPoint = (e) => {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e, preventPan = false) => {
    // マウスイベントかつ左クリック以外なら弾く（タッチイベントは通す）
    if ((e.type.includes('mouse') && e.button !== 0) || preventPan || isAltPressedRef.current) return;
    isPanning.current = true;
    startPos.current = getPoint(e); // 修正
    if (stageXRef.current) stageXRef.current.style.transition = 'none';
    if (stageEventsXRef.current) stageEventsXRef.current.style.transition = 'none';
    if (stageYRef.current) stageYRef.current.style.transition = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const pos = getPoint(e); // 修正
    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;

    if (stageXRef.current) stageXRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (stageEventsXRef.current) stageEventsXRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (stageYRef.current) stageYRef.current.style.transform = `translate3d(0, ${currentPanY.current + dy}px, 0)`;
  };

  const handleMouseUp = (e) => {
    if (!isPanning.current) return;
    isPanning.current = false;
    const pos = getPoint(e); // 修正
    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;

    const deltaYear = dx / viewState.zoom;
    const newPanY = currentPanY.current + dy;
    currentPanY.current = newPanY;

    setViewState(prev => ({
      ...prev,
      centerX: prev.centerX - deltaYear,
      panY: newPanY
    }));

    if (stageXRef.current) stageXRef.current.style.transform = `translate3d(0, 0, 0)`;
    if (stageEventsXRef.current) stageEventsXRef.current.style.transform = `translate3d(0, 0, 0)`;
    if (stageYRef.current) stageYRef.current.style.transform = `translate3d(0, ${newPanY}px, 0)`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      
      setViewState(prev => {
        if (e.ctrlKey || e.metaKey) {
          const minH = minLaneHeightRef.current;
          return {
            ...prev,
            laneHeight: Math.min(Math.max(prev.laneHeight * factor, minH), 600)
          };
        }
        return {
          ...prev,
          zoom: Math.min(Math.max(prev.zoom * factor, 0.1), 3000)
        };
      });
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return { viewState, containerRef, stageXRef, stageEventsXRef, stageYRef, isPanning, handleMouseDown, handleMouseMove, handleMouseUp };
}