const faqs = [
  {
    q: "How old do I need to be?",
    a: "You must be 21 or older to browse and buy. We verify your age and ID at checkout, and an adult 21+ must sign for delivery.",
  },
  {
    q: "Where do you ship?",
    a: "[Add eligible states, delivery times and shipping costs.]",
  },
  {
    q: "How do I read potency and dosage?",
    a: "[Add how potency is shown on each pack and dosage guidance.]",
  },
  {
    q: "Where can I find lab results?",
    a: "[Add where to find certificates of analysis for each batch.]",
  },
  {
    q: "What is your returns policy?",
    a: "[Add returns, refunds and damaged-order policy.]",
  },
];

export default function Faq() {
  return (
    <section className="bg-sand">
      <div className="shell pt-12 pb-16 lg:pt-[78px] lg:pb-[100px]">
        <div className="mx-auto max-w-[906px]">
          <h2 className="text-[30px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-[43px]">
            Good to know
          </h2>
          <div className="mt-7 flex flex-col gap-3.5 lg:mt-[51px]">
            {faqs.map((f, i) => (
              // Shared `name` makes the browser keep only one item open.
              <details
                key={f.q}
                name="faq"
                open={i === 0}
                className="group rounded-[22px] bg-white"
              >
                <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 px-[18px] py-3 text-[17px] leading-[1.3] font-bold sm:px-[26px] sm:text-[21px] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-lime">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M2 6h8" />
                      <path className="group-open:hidden" d="M6 2v8" />
                    </svg>
                  </span>
                </summary>
                <p className="px-[18px] pt-px pb-6 text-base leading-7 sm:pr-[110px] sm:pb-[25px] sm:pl-[26px] sm:text-[17px]">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
