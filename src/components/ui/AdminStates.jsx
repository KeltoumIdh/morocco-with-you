import Icon from "../Icon";
import { ICONS } from "../../config/nav";
import Button from "./Button";

export const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
    ))}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
      <Icon d={ICONS.alert} size={20} className="text-red-500" />
    </div>
    <p className="font-semibold text-slate-700 mb-1">Failed to load data</p>
    <p className="text-sm text-slate-400 mb-4">{message || "Something went wrong. Please try again."}</p>
    {onRetry && (
      <Button onClick={onRetry} size="sm">
        Try Again
      </Button>
    )}
  </div>
);

