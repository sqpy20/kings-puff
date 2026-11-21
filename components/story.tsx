const values = [
  { title: "Clear labels", text: "Potency and ingredients on every pack.", color: "bg-pink" },
  { title: "Batch info", text: "[Link to certificates of analysis.]", color: "bg-lime" },
  { title: "21+ always", text: "ID verified before every order.", color: "bg-teal" },
  { title: "Loud colour", text: "Designed to stand out on any shelf.", color: "bg-orange" },
];

// Repeating wavy edge in the section colour; `flip` turns it into the bottom
// edge, which sits on the sand background of the FAQ section that follows.
function Wave({ flip = false }: { flip?: boolean }) {
  const id = flip ? "story-wave-bottom" : "story-wave-top";
  return (
    <svg
      aria-hidden="true"
      className={`block h-10 w-full text-purple ${flip ? "-mt-px rotate-180 bg-sand" : "-mb-px"}`}
    >
      <defs>
        <pattern id={id} width="262" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M0 13Q32.75 0 65.5 0T131 13t65.5 13T262 13V40H0Z"
            fill="currentColor"
          />
        </pattern>
      </defs>
      <rect width="100%" height="40" fill={`url(#${id})`} />
    </svg>
  );
}

export default function Story() {
  return (
    <section>
      <Wave />
      <div className="bg-purple text-white">
        <div className="shell flex flex-col gap-12 pt-10 pb-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:pt-[79px] lg:pb-[104px]">
          <div className="lg:w-[43%]">
            <p className="text-[11.5px] leading-4 font-bold tracking-[0.1em] uppercase">
              Our story
            </p>
            <h2 className="mt-7 text-[40px] leading-[1.07] font-extrabold tracking-[-0.04em] sm:text-[52px] xl:text-[60px]">
              Free spirits,{" "}
              <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
                serious
              </em>{" "}
              standards.
            </h2>
            <p className="mt-[26px] max-w-[600px] text-lg leading-[1.68] xl:text-[19px]">
              Momo Eliquid started with a simple idea: the stuff we love should
              look as good as it feels to share. So we packed bold colour and
              good vibes into every product, and kept the boring parts —
              potency, ingredients, batch info — clear and easy to find.
            </p>
            <p className="mt-6 text-[17px] leading-7">
              [Add founding story, location and year.]
            </p>
          </div>
          {/* On desktop the right-hand column of cards sits 52px lower. */}
          <ul className="grid grid-cols-2 gap-4 text-ink lg:w-[48.2%] lg:gap-x-[18px] lg:gap-y-[70px] lg:pb-[52px]">
            {values.map((v) => (
              <li key={v.title} className="@container lg:even:translate-y-[52px]">
                <div
                  className={`flex aspect-square flex-col justify-end rounded-[clamp(20px,8.4cqw,28px)] p-[clamp(14px,7.8cqw,26px)] ${v.color}`}
                >
                  <h3 className="text-[clamp(17px,7.2cqw,24px)] leading-[1.3] font-extrabold tracking-[-0.01em]">
                    {v.title}
                  </h3>
                  <p className="mt-[3px] text-[clamp(13px,4.5cqw,15px)] leading-[1.45]">
                    {v.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Wave flip />
    </section>
  );
}
