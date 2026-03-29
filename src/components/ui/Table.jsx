function Table({ columns = [], data = [], actions, emptyMsg = "No data found." }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {(columns || []).map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {(data || []).length === 0 ? (
            <tr>
              <td
                colSpan={(columns || []).length + (actions ? 1 : 0)}
                className="px-4 py-10 text-center text-slate-400 text-sm"
              >
                {emptyMsg}
              </td>
            </tr>
          ) : (
            (data || []).map((row, i) => (
              <tr key={row.id || i} className="row-hover border-b border-slate-50 group">
                {(columns || []).map((c) => (
                  <td key={c.key} className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3.5 text-right">
                    <div className="row-actions inline-flex items-center gap-1 justify-end">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

