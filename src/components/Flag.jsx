// Renders a flag as an <img> when given a URL, or as an emoji/text otherwise.
// `wave` adds the gentle clip-path flutter used on match cards.
export default function Flag({ src, size = 26, wave = false }) {
  if (src && /^https?:\/\//.test(src)) {
    return (
      <img
        className={'fl-img' + (wave ? ' wave' : '')}
        src={src}
        alt=""
        loading="lazy"
        style={{ width: Math.round(size * 1.4), height: size, objectFit: 'cover' }}
      />
    );
  }
  return (
    <span className={'fl' + (wave ? ' wave' : '')} style={{ fontSize: size }}>
      {src || '⚽'}
    </span>
  );
}
