import Icon from "../Icon";
import { ICONS } from "../../config/nav";

function Button({
  children,
  variant = "ghost",
  size = "sm",
  icon,
  onClick,
  disabled,
  className = "",
  type = "button",
}) {
  const base =
    "inline-flex items-center gap-2 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sz =
    size === "lg"
      ? "px-5 py-2.5 text-sm"
      : size === "xs"
        ? "px-2 py-1 text-xs"
        : "px-3.5 py-2 text-sm";

  const v = {
    primary: "bg-slate-800 text-white hover:bg-slate-700",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    ghost: "text-slate-600 border border-slate-200 hover:bg-slate-50",
    link: "text-blue-600 hover:text-blue-700 px-0 py-0",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${v[variant]} ${className}`}
    >
      {icon && <Icon d={ICONS[icon]} size={13} />}
      {children}
    </button>
  );
}

export default Button;

