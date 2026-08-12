"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { FaqList } from "@/components/FaqList";
import { site } from "@/data/site";
import {
  formatAddressLines,
  trustSignals,
} from "@/data/trustSignals";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [topic, setTopic] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const addressLines = formatAddressLines();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTopic = params.get("topic");
    setTopic(nextTopic);
    if (nextTopic === "lab-feedback") {
      setMessageDraft(
        "Lab feedback (ordering / documentation / support):\n\n",
      );
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    const subjectLabel =
      topic === "lab-feedback"
        ? `Lab feedback from ${name || "site visitor"}`
        : `Note from ${name || "site visitor"}`;
    const subject = encodeURIComponent(subjectLabel);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
    );

    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <div className="site-shell py-20">
      <div className="max-w-2xl">
        <p className="label">Reach out</p>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Write us like a colleague
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          Assay files, stock checks, shipping, or a multi-lot plan — one clear
          note is enough. Email is the best way to reach us.
        </p>
      </div>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-8">
          <label className="block">
            <span className="label">Name</span>
            <input
              name="name"
              required
              className="mt-3 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-sm outline-none transition focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-3 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-sm outline-none transition focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label">Message</span>
            <textarea
              name="message"
              required
              rows={4}
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              className="mt-3 w-full resize-y border-0 border-b border-line bg-transparent px-0 py-3 text-sm outline-none transition focus:border-ink"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-arrow">
            Compose email
          </button>
          {status === "sent" ? (
            <p className="text-sm text-accent-deep">
              Your mail app should open with the draft filled in.
            </p>
          ) : null}
          <p className="text-sm text-ink-soft">
            Or write directly:{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-ink underline decoration-line underline-offset-4"
            >
              {site.email}
            </a>
          </p>

          {trustSignals.legalEntityName || addressLines.length > 0 ? (
            <div className="border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
              {trustSignals.legalEntityName ? (
                <p className="font-medium text-ink">
                  {trustSignals.legalEntityName}
                </p>
              ) : null}
              {addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </form>

        <div>
          <section aria-labelledby="contact-faq">
            <p className="label">FAQ</p>
            <h2
              id="contact-faq"
              className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            >
              Common questions
            </h2>
            <div className="mt-6">
              <FaqList />
            </div>
            <p className="mt-8 text-sm leading-relaxed text-ink-soft">
              Looking for handling or compliance detail? Start with{" "}
              <Link
                href="/resources/research-use-only"
                className="text-ink underline decoration-line underline-offset-4"
              >
                research use only
              </Link>
              ,{" "}
              <Link
                href="/resources/identity-and-purity"
                className="text-ink underline decoration-line underline-offset-4"
              >
                identity and purity
              </Link>
              , or{" "}
              <Link
                href="/resources/reconstitution-and-storage"
                className="text-ink underline decoration-line underline-offset-4"
              >
                stock preparation and storage
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
