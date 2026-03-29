function SectionHeader({ title, desc, right }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="syne font-semibold text-slate-800">{title}</h2>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export default SectionHeader;

