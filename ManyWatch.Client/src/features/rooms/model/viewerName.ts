export function getViewerName(userId: string, isMe: boolean): string {
  if (isMe) {
    return 'You';
  }

  const suffix = userId.replaceAll('-', '').slice(0, 6);
  return suffix ? `Viewer ${suffix}` : 'Viewer';
}
