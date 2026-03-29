const GRADS = [
  "from-rose-400 to-orange-300",
  "from-blue-400 to-cyan-300",
  "from-violet-400 to-purple-300",
  "from-emerald-400 to-teal-300",
  "from-amber-400 to-yellow-300",
  "from-pink-400 to-rose-300",
  "from-indigo-400 to-blue-300",
];

function gradFor(s) {
  const score = s
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADS[score % GRADS.length];
}

function Avatar({ initials, size = "sm" }) {
  const sz =
    size === "lg"
      ? "w-10 h-10 text-sm"
      : size === "xl"
        ? "w-14 h-14 text-base"
        : "w-7 h-7 text-xs";
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br ${gradFor(
        initials
      )} flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export default Avatar;

