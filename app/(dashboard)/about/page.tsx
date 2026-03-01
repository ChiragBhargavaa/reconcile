import { Github, Linkedin, ExternalLink, Heart } from "lucide-react";

export const metadata = {
  title: "About — Reconcile",
  description: "The story behind Reconcile and the person who built it.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          About
        </h1>
      </div>

      {/* Origin Story */}
      <section className="rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 space-y-5">
        <h2 className="text-xl font-semibold text-zinc-900">
          It started on a trip
        </h2>

        <div className="space-y-4 text-[15px] leading-relaxed text-zinc-700">
          <p>Friends, food, chaos… and one simple problem. Splitting expenses.</p>

          <p>
            So we did what everyone does. Search for an app. Every app looked
            good — until the paywall appeared.
          </p>

          <p>Split the bill? Pay.</p>
          <p>Settle properly? Pay.</p>
          <p>Use basic features? Pay.</p>

          <p>
            That moment hurt my developer ego a little. So I decided to build
            one myself.
          </p>

          <p>That is how Reconcile started.</p>
        </div>
      </section>

      {/* What Reconcile Is */}
      <section className="rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900">
          What is Reconcile?
        </h2>

        <div className="space-y-4 text-[15px] leading-relaxed text-zinc-700">
          <p>
            A clean, simple expense splitting app where the core functionality
            stays <span className="font-semibold text-zinc-900">free</span>. No
            unnecessary locks. No paywall for basic use. Just something that
            works when you and your friends need it.
          </p>

          <p className="text-zinc-500">
            This project is open source and built in the spirit of the internet I
            grew up loving.
          </p>

          <p>
            If you like it, use it. If it helps you, share it. If you want to
            support it, you can contribute or donate.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="https://github.com/ChiragBhargavaa/reconcile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800"
          >
            <Github size={16} />
            View on GitHub
          </a>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/40 px-4 py-2.5 text-sm font-medium text-zinc-400 ring-1 ring-white/30"
          >
            <Heart size={16} />
            Donate (coming soon)
          </button>
        </div>
      </section>

      {/* About Me */}
      <section className="rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900">
          About me
        </h2>

        <div className="space-y-3 text-[15px] leading-relaxed text-zinc-700">
          <p>
            I&apos;m{" "}
            <span className="font-semibold text-zinc-900">Chirag Bhargava</span>.
          </p>
          <p>B.Tech student at LNMIIT, Jaipur.</p>
          <p>
            I&apos;m a full stack engineer who enjoys building products from
            idea to deployment. I also work with app development using Expo and
            love turning small frustrations into real software.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="https://github.com/ChiragBhargavaa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800"
          >
            <Github size={16} />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/chiragbhargava/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800"
          >
            <Linkedin size={16} />
            LinkedIn
          </a>
          <a
            href="https://www.upwork.com/freelancers/~011fc977b142d0aa46?mp_source=share"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800"
          >
            <ExternalLink size={16} />
            Upwork
          </a>
        </div>
      </section>

    </div>
  );
}
