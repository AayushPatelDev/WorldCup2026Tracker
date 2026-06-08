// Renders a flag as an <img> when given a URL, or as an emoji/text otherwise.
export default function Flag({ src, size = 26 }) {
  if (src && /^https?:\/\//.test(src)) {
    return (
      <img
        className="fl-img"
        src={src}
        alt=""
        style={{ width: size * 1.35, height: size, objectFit: 'cover' }}
      />
    );
  }
  return (
    <span className="fl" style={{ fontSize: size }}>
      {src || '⚽'}
    </span>
  );
}
