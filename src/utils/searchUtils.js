import { isEventInTimeline } from './laneUtils';

export const evaluateSearchMatch = (event, searchTags, searchLogic, searchInput, timelines = []) => {
  const previewTags = [...searchTags];
  const trimmedInput = (searchInput || '').trim();
  
  if (trimmedInput && !previewTags.find(t => t.text === trimmedInput)) {
    previewTags.push({ text: trimmedInput, logic: searchLogic });
  }
  
  if (previewTags.length === 0) return { isSearchHighlighted: false, isDimmed: false };

  // ★ 実際のタグに加え、「イベントのタイトル」と「所属する年表のタイトル」を仮想タグとして合成
  const evTags = [...(event.tags || [])];
  if (event.title) evTags.push(event.title);
  
  timelines.forEach(tl => {
    // 仮登録（includedEventIds）もこの判定に含まれるため、ドラッグ追加した瞬間にタグとして機能します
    if (isEventInTimeline(event, tl)) {
      evTags.push(tl.title);
    }
  });

  const checkTag = (searchStr) => {
    const lowerSearch = searchStr.toLowerCase();
    return evTags.some(t => t.toLowerCase().includes(lowerSearch));
  };

  let isMatch = false;
  if (searchLogic === 'AND') {
    isMatch = previewTags.every(tag => checkTag(tag.text));
  } else {
    isMatch = previewTags.some(tag => checkTag(tag.text));
  }

  return { isSearchHighlighted: isMatch, isDimmed: !isMatch };
};