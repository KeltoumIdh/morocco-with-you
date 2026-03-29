function PageHeader({ title, description }) {
  return (
    <div className="page-enter">
      <h1 className="syne text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">{description}</p>
      ) : null}
    </div>
  );
}

export default PageHeader;

