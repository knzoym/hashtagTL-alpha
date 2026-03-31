import { dateToYearDecimal } from './timelineUtils';

export const TOP_MARGIN = 150;
const PADDING_Y = 4;
const X_GAP = 10;
const Y_GAP = 6;

export const CARD_CONFIG = {
  small: { width: 90, height: 26, padding: '3px', fontSize: '10px', border: '1px', noImage: true },
  medium: { width: 120, height: 75, imgHeight: '50px', padding: '4px', fontSize: '10px', border: '1px' },
  large: { width: 170, height: 130, imgHeight: '95px', padding: '8px', fontSize: '11px', border: '2px' }
};

export const calculateLayouts = (events, activeTags, cardSize, yearToXFunc, laneHeight) => {
  const layoutMap = {};
  const overflowQueue = [];
  const placedCards = {}; 

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedEvents.forEach(event => {
    const x = yearToXFunc(dateToYearDecimal(event.date));
    const hasImage = !!event.image;
    const actualConfig = hasImage ? (CARD_CONFIG[cardSize] || CARD_CONFIG.medium) : CARD_CONFIG.small;
    const w = actualConfig.width;
    const h = actualConfig.height;

    const lanes = activeTags.filter(tag => event.tags?.includes(tag));
    const targetLanes = lanes.length > 0 ? lanes : ['INBOX'];

    targetLanes.forEach(tag => {
      if (!placedCards[tag]) placedCards[tag] = [];

      const xOverlapping = placedCards[tag].filter(c => !(x + w + X_GAP <= c.x || x >= c.x + c.w + X_GAP));

      if (tag === 'INBOX') {
        // --- INBOX: 境界線から上方向へ無限に積み重ねる ---
        const startY = TOP_MARGIN - PADDING_Y - h; // INBOXの最下段
        xOverlapping.sort((a, b) => b.y - a.y); // 下から上に判定

        let testY = startY;
        while (true) {
          const collider = xOverlapping.find(c => (testY < c.y + c.h + Y_GAP) && (testY + h + Y_GAP > c.y));
          if (!collider) break;
          testY = collider.y - h - Y_GAP; // 衝突したら上へ移動
        }

        placedCards[tag].push({ x, y: testY, w, h });
        layoutMap[`${event.id}-${tag}`] = { top: testY + h / 2, actualConfig, isOverflow: false };

      } else {
        // --- 通常レーン: 下方向へ配置、溢れたらチップ化 ---
        const laneIndex = activeTags.indexOf(tag);
        const areaTop = TOP_MARGIN + (laneIndex * laneHeight);
        const areaHeight = laneHeight;

        const startY = areaTop + PADDING_Y;
        let maxY = areaTop + areaHeight - h - 32;
        if (maxY < startY) maxY = startY;

        xOverlapping.sort((a, b) => a.y - b.y);

        let testY = startY;
        let placed = false;

        while (testY <= maxY) {
          const collider = xOverlapping.find(c => (testY < c.y + c.h + Y_GAP) && (testY + h + Y_GAP > c.y));
          if (!collider) {
            placed = true;
            break;
          }
          testY = collider.y + collider.h + Y_GAP; // 衝突したら下へ移動
        }

        if (placed && testY <= maxY) {
          placedCards[tag].push({ x, y: testY, w, h });
          layoutMap[`${event.id}-${tag}`] = { top: testY + h / 2, actualConfig, isOverflow: false };
        } else {
          overflowQueue.push({ x, tag, eventId: event.id });
          layoutMap[`${event.id}-${tag}`] = { isOverflow: true };
        }
      }
    });
  });

  const overflowGroups = {};
  overflowQueue.forEach(item => {
    const { x, tag } = item;
    if (!overflowGroups[tag]) overflowGroups[tag] = [];

    let group = overflowGroups[tag].find(g => Math.abs(g.x - x) < 22);
    if (group) {
      group.count++;
      group.x = (group.x + x) / 2;
    } else {
      overflowGroups[tag].push({ x, count: 1 });
    }
  });

  const laneChips = {};
  const chipTrackEnds = {};

  // INBOXはチップ化しないため、activeTagsのみ処理
  activeTags.forEach(tag => {
    if (!overflowGroups[tag]) return;
    const laneIndex = activeTags.indexOf(tag);
    const areaTop = TOP_MARGIN + (laneIndex * laneHeight);
    const chipTop = areaTop + laneHeight - 16;

    laneChips[tag] = [];
    overflowGroups[tag].sort((a, b) => a.x - b.x).forEach(group => {
      let xPos = group.x;
      const lastXEnd = chipTrackEnds[tag] || -Infinity;

      if (xPos - 20 < lastXEnd + 4) xPos = lastXEnd + 4 + 20;

      laneChips[tag].push({ ...group, x: xPos, top: chipTop });
      chipTrackEnds[tag] = xPos + 20;
    });
  });

  return { layoutMap, laneChips };
};