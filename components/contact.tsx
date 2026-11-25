"use client";

import { type FormEvent, useState } from "react";
import { ArrowIcon } from "./illustrations";

const field =
  "mt-2 block w-full rounded-xl border-2 border-ink bg-white px-[18px] text-[17px] font-normal placeholder:text-ink/40";

export default function Contact({ padTop = false }: { padTop?: boolean }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const message = String(formData.get("message") ?? "");
    const website = String(formData.get("website") ?? "");

    setStatus("submitting");
    setFeedback(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });

      let data: { error?: string } | null = null;
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus("error");
        setFeedback(data?.error || "Something went wrong. Please try again.");
        return;
      }

      form.reset();
      setStatus("sent");
      setFeedback(
        "Thanks for reaching out — your message has been sent. We'll get back to you soon.",
      );
    } catch {
      setStatus("error");
      setFeedback("Something went wrong. Please try again.");
    }
  }

  const submitting = status === "submitting";

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
            and we&apos;ll get back to you. support@momoeliquidz.co.uk
          </p>
          <form
            onSubmit={onSubmit}
            className="mt-8 grid gap-5 sm:grid-cols-2"
          >
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <label className="text-[15px] font-bold">
              Name
              <input
                name="name"
                required
                disabled={submitting}
                autoComplete="name"
                placeholder="Your name"
                className={`${field} h-[55px] disabled:opacity-60`}
              />
            </label>
            <label className="text-[15px] font-bold">
              Email
              <input
                name="email"
                type="email"
                required
                disabled={submitting}
                autoComplete="email"
                placeholder="you@email.com"
                className={`${field} h-[55px] disabled:opacity-60`}
              />
            </label>
            <label className="text-[15px] font-bold sm:col-span-2">
              Message
              <textarea
                name="message"
                required
                disabled={submitting}
                rows={5}
                placeholder="How can we help?"
                className={`${field} py-3.5 leading-7 disabled:opacity-60`}
              />
            </label>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-14 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-7 text-[17px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send message"}
                <ArrowIcon className="size-[18px]" />
              </button>
              {feedback && (
                <p
                  role={status === "error" ? "alert" : "status"}
                  className={`text-[15px] leading-6 ${
                    status === "error" ? "font-semibold text-[#c8102e]" : ""
                  }`}
                >
                  {feedback}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
