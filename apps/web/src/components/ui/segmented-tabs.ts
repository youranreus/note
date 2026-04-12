export function moveTabSelection(
  currentIndex: number,
  optionCount: number,
  direction: 'next' | 'prev'
) {
  if (optionCount <= 0) {
    return 0
  }

  if (direction === 'next') {
    return (currentIndex + 1) % optionCount
  }

  return (currentIndex - 1 + optionCount) % optionCount
}
