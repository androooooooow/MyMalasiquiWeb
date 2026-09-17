export default function PageHeader({ eyebrow = 'Response workspace', title, description, action }) {
  return (
    <div className="rescue-page-head">
      <div>
        <p className="rescue-eyebrow">{eyebrow}</p>
        <h1 className="rescue-page-title">{title}</h1>
        <p className="rescue-page-lede">{description}</p>
      </div>
      {action}
    </div>
  );
}
