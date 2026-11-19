export function storyContextLines(lines) {
  const legacyNotice = '요청은 처리되지 않았으며 상태는 유지됩니다.';
  const oldNotice = line => line?.type === 'narration' && line.text?.trim() === legacyNotice;
  return lines.filter((line, index) => {
    if (line.type === 'player') return true;
    if (line.metadata?.abcExcludeFromContext === true || oldNotice(line)) return false;
    return !(line.type === 'character' && oldNotice(lines[index + 1]));
  });
}
