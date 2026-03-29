export const MS_PER_YEAR = 31536000000;

// 日付文字列から「年（小数）」に変換
export const dateToYearDecimal = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 2000; // 不正な日付のフォールバック
  return date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365);
};

// 「年（小数）」から日付文字列（YYYY-MM-DD）に変換
export const yearDecimalToDateStr = (yearDecimal) => {
  const year = Math.floor(yearDecimal);
  const remainder = yearDecimal - year;
  const date = new Date(year, 0, 1);
  date.setMilliseconds(remainder * MS_PER_YEAR);
  return date.toISOString().split('T')[0];
};

// ズームに応じた目盛り（Ticks）を生成
export const getTicks = (viewState, containerWidth) => {
  const { centerX, zoom } = viewState;
  const startYear = centerX - (containerWidth / 2 / zoom);
  const endYear = centerX + (containerWidth / 2 / zoom);
  const ticks = [];

  let unit, majorStep;

  if (zoom > 5000) { unit = '10day'; majorStep = 'month'; }
  else if (zoom > 800) { unit = 'month'; majorStep = 'year'; }
  else if (zoom > 80) { unit = 'year'; majorStep = '10year'; }
  else if (zoom > 8) { unit = '10year'; majorStep = '100year'; }
  else { unit = '100year'; majorStep = '1000year'; }

  // 描画範囲を少し広めに設定してループ
  const loopStart = Math.floor(startYear / 100) * 100;
  const loopEnd = Math.ceil(endYear / 100) * 100 + 100;

  for (let y = loopStart; y <= loopEnd; y++) {
    if (unit === '100year' || unit === '10year' || unit === 'year') {
      const step = unit === '100year' ? 100 : (unit === '10year' ? 10 : 1);
      if (y % step === 0) {
        const isMajor = (unit === 'year' && y % 10 === 0) || 
                        (unit === '10year' && y % 100 === 0) || 
                        (unit === '100year' && y % 1000 === 0);
        ticks.push({ date: `${y}-01-01`, label: `${y}`, isMajor });
      }
    } else {
      for (let m = 1; m <= 12; m++) {
        if (unit === 'month') {
          ticks.push({ 
            date: `${y}-${String(m).padStart(2, '0')}-01`, 
            label: m === 1 ? `${y}` : `${m}月`, 
            isMajor: m === 1 
          });
        } else if (unit === '10day') {
          for (let d = 1; d <= 31; d += 10) {
            ticks.push({ 
              date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, 
              label: d === 1 ? `${m}月` : `${d}`, 
              isMajor: d === 1 
            });
          }
        }
      }
    }
  }
  return ticks;
};