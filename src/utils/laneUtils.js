import { dateToYearDecimal } from './timelineUtils';

export const TOP_MARGIN = 150;
// LANE_GAPは削除しました
const PADDING_Y = 4;
const X_GAP = 10;
const Y_GAP = 6;

export const CARD_CONFIG = {
  small: { width: 90, height: 26, padding: '3px', fontSize: '10px', border: '1px', noImage: true },
  medium: { width: 120, height: 75, imgHeight: '50px', padding: '4px', fontSize: '10px', border: '1px' },
  large: { width: 170, height: 130, imgHeight: '95px', padding: '8px', fontSize: '11px', border: '2px' }
};

// イベントが特定の年表（横軸）に属するか判定
export const isEventInTimeline = (event, timeline) => {
  if (timeline.includedEventIds?.includes(event.id)) return true;
  if (timeline.excludedEventIds?.includes(event.id)) return false;

  const condition = timeline.condition;
  if (!condition || !condition.tags || condition.tags.length === 0) return false;

  const eventTags = event.tags || [];
  
  if (condition.logic === 'AND') {
    return condition.tags.every(tagObj => 
      eventTags.includes(typeof tagObj === 'string' ? tagObj : tagObj.text)
    );
  } else {
    let result = false;
    condition.tags.forEach((tagObj, index) => {
      const tagText = typeof tagObj === 'string' ? tagObj : tagObj.text;
      const match = eventTags.includes(tagText);
      
      if (index === 0) {
        result = match;
      } else {
        const logic = tagObj.logic || 'OR';
        if (logic === 'AND') {
          result = result && match;
        } else {
          result = result || match;
        }
      }
    });
    return result;
  }
};

export const calculateLayouts = (events, timelines, cardSize, yearToXFunc, laneHeight) => {
  const layoutMap = {};
  const overflowQueue = [];
  const placedCards = {}; 

  // ★修正: new Date() ではなく dateToYearDecimal で安全にソートする
  const sortedEvents = [...events].sort((a, b) => {
    return dateToYearDecimal(a.date) - dateToYearDecimal(b.date);
  });

  sortedEvents.forEach(event => {
    const decimalYear = dateToYearDecimal(event.date);
    const x = yearToXFunc(decimalYear);
    
    if (isNaN(x)) return;

    const hasImage = !!event.image;
    const actualConfig = hasImage ? (CARD_CONFIG[cardSize] || CARD_CONFIG.medium) : CARD_CONFIG.small;
    const w = actualConfig.width;
    const h = actualConfig.height;

    const targetTimelineIds = timelines
      .filter(tl => isEventInTimeline(event, tl))
      .map(tl => tl.id);

    const targetLanes = targetTimelineIds.length > 0 ? targetTimelineIds : ['INBOX'];

    targetLanes.forEach(laneId => {
      if (!placedCards[laneId]) placedCards[laneId] = [];

      const leftA = x - w / 2;
      const rightA = x + w / 2;
      const xOverlapping = placedCards[laneId].filter(c => {
        const leftB = c.x - c.w / 2;
        const rightB = c.x + c.w / 2;
        return !(rightA + X_GAP <= leftB || leftA >= rightB + X_GAP);
      });

      if (laneId === 'INBOX') {
        const startY = TOP_MARGIN - PADDING_Y - h;
        xOverlapping.sort((a, b) => b.y - a.y);

        let testY = startY;
        while (true) {
          const collider = xOverlapping.find(c => (testY < c.y + c.h + Y_GAP) && (testY + h + Y_GAP > c.y));
          if (!collider) break;
          testY = collider.y - h - Y_GAP;
        }

        placedCards[laneId].push({ x, y: testY, w, h });
        layoutMap[`${event.id}-${laneId}`] = { top: testY + h / 2, actualConfig, isOverflow: false };

      } else {
        const laneIndex = timelines.findIndex(tl => tl.id === laneId);
        const areaTop = TOP_MARGIN + (laneIndex * laneHeight);
        const areaHeight = laneHeight;
        const centerY = areaTop + areaHeight / 2;

        const minY = areaTop + PADDING_Y;
        const maxY = areaTop + areaHeight - h - PADDING_Y;

        let placed = false;
        let bestY = null;

        const steps = Math.ceil(areaHeight / (h + Y_GAP)); 
        for (let i = 0; i <= steps; i++) {
          let testY1 = centerY - h / 2 + i * (h + Y_GAP); 
          let testY2 = centerY - h / 2 - i * (h + Y_GAP); 

          if (testY1 >= minY && testY1 <= maxY) {
            const collider = xOverlapping.find(c => (testY1 < c.y + c.h + Y_GAP) && (testY1 + h + Y_GAP > c.y));
            if (!collider) {
              bestY = testY1;
              placed = true;
              break;
            }
          }
          if (i > 0 && testY2 >= minY && testY2 <= maxY) {
            const collider = xOverlapping.find(c => (testY2 < c.y + c.h + Y_GAP) && (testY2 + h + Y_GAP > c.y));
            if (!collider) {
              bestY = testY2;
              placed = true;
              break;
            }
          }
        }

        if (placed) {
          placedCards[laneId].push({ x, y: bestY, w, h });
          layoutMap[`${event.id}-${laneId}`] = { top: bestY + h / 2, laneCenterY: centerY, actualConfig, isOverflow: false };
        } else {
          overflowQueue.push({ x, laneId, eventId: event.id });
          layoutMap[`${event.id}-${laneId}`] = { isOverflow: true };
        }
      }
    });
  });

  const overflowGroups = {};
  overflowQueue.forEach(item => {
    const { x, laneId } = item;
    if (!overflowGroups[laneId]) overflowGroups[laneId] = [];

    let group = overflowGroups[laneId].find(g => Math.abs(g.x - x) < 22);
    if (group) {
      group.count++;
      group.x = (group.x + x) / 2;
    } else {
      overflowGroups[laneId].push({ x, count: 1 });
    }
  });

  const laneChips = {};
  const chipTrackEnds = {};

  timelines.forEach(tl => {
    const laneId = tl.id;
    if (!overflowGroups[laneId]) return;
    const laneIndex = timelines.findIndex(t => t.id === laneId);
    const areaTop = TOP_MARGIN + (laneIndex * laneHeight);
    const chipTop = areaTop + laneHeight - 16;

    laneChips[laneId] = [];
    overflowGroups[laneId].sort((a, b) => a.x - b.x).forEach(group => {
      let xPos = group.x;
      const lastXEnd = chipTrackEnds[laneId] || -Infinity;

      if (xPos - 20 < lastXEnd + 4) xPos = lastXEnd + 4 + 20;

      laneChips[laneId].push({ ...group, x: xPos, top: chipTop });
      chipTrackEnds[laneId] = xPos + 20;
    });
  });

  return { layoutMap, laneChips };
};