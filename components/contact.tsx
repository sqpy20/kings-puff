"use client";

import { type FormEvent, useState } from "react";
import { ArrowIcon } from "./illustrations";

const field =
  "mt-2 block w-full rounded-xl border-2 border-ink bg-white px-[18px] text-[17px] font-normal placeholder:text-ink/40";

export default function Contact({ padTop = false }: { padTop?: boolean }) {
  const [submitted, setSubmitted] = useState(false);

  // No backend yet: sending is not connected, so we only show a notice.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="scroll-mt-24 bg-sand">
      <div
        className={`shell pb-16 lg:pb-[100px] ${padTop ? "pt-12 lg:pt-[78px]" : ""}`}
      >
        <div className="mx-auto max-w-[906px] rounded-[28px] bg-white px-[18px] py-8 sm:px-10 sm:py-12">
          <p className="text-[11.5px] leading-4 font-bold tracking-[0.1em] uppercase">
            Contact
          </p>
          <h2 className="mt-3 text-[30px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-[43px]">
            Get in{" "}
            <em className="font-serif text-[1.1em] leading-[0] font-normal tracking-[-0.01em]">
              touch.
            </em>
          </h2>
          <p className="mt-4 max-w-[620px] text-[17px] leading-7">
            Questions about an order, a product or lab results? Send us a note
            and we&apos;ll get back to you. [Add support email and hours.]
          </p>
          <form
            onSubmit={onSubmit}
            className="mt-8 grid gap-5 sm:grid-cols-2"
          >
            <label className="text-[15px] font-bold">
              Name
              <input
                name="name"
                required
                autoComplete="name"
                placeholder="Your name"
                className={`${field} h-[55px]`}
              />
            </label>
            <label className="text-[15px] font-bold">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                className={`${field} h-[55px]`}
              />
            </label>
            <label className="text-[15px] font-bold sm:col-span-2">
              Message
              <textarea
                name="message"
                required
                rows={5}
                placeholder="How can we help?"
                className={`${field} py-3.5 leading-7`}
              />
            </label>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-span-2">
              <button
                type="submit"
                className="inline-flex h-14 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-7 text-[17px] font-bold text-white"
              >
                Send message
                <ArrowIcon className="size-[18px]" />
              </button>
              {submitted && (
                <p role="status" className="text-[15px] leading-6">
                  [Contact form is not connected yet. Add an email service to
                  send messages.]
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
