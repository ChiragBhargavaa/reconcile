import Link from "next/link";
import { ArrowLeft, Github, Linkedin, ExternalLink, Heart } from "lucide-react";

export const metadata = {
  title: "About — Reconcile",
  description: "The story behind Reconcile and the person who built it.",
};

export default function AboutPage() {
  return (
    <div
      className="relative min-h-screen"
      style={{}}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        {/* Origin Story */}
        <section className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            It started on a trip
          </h1>

          <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-zinc-300">
            <p>
              Friends, food, chaos… and one simple problem.{" "}
              <span className="font-semibold text-white">Splitting expenses.</span>
            </p>

            <p>
              So we did what everyone does. Search for an app. Every app looked
              good — until the paywall appeared.
            </p>

            <div className="my-8 space-y-2 border-l-2 border-purple-400/50 pl-5 text-zinc-400">
              <p>Split the bill? <span className="text-zinc-300">Pay.</span></p>
              <p>Settle properly? <span className="text-zinc-300">Pay.</span></p>
              <p>Use basic features? <span className="text-zinc-300">Pay.</span></p>
            </div>

            <p>
              That moment hurt my developer ego a little. So I decided to build
              one myself.
            </p>

            <p>
              That is how{" "}
              <span className="font-semibold text-purple-300">Reconcile</span>{" "}
              started.
            </p>
          </div>
        </section>

        {/* What Reconcile Is */}
        <section className="mb-16 rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-sm">
          <p className="text-[17px] leading-relaxed text-zinc-300">
            A clean, simple expense splitting app where the core functionality
            stays <span className="font-semibold text-white">free</span>. No
            unnecessary locks. No paywall for basic use. Just something that
            works when you and your friends need it.
          </p>

          <p className="mt-5 text-[17px] leading-relaxed text-zinc-400">
            This project is open source and built in the spirit of the internet I
            grew up loving.
          </p>

          <p className="mt-5 text-[17px] leading-relaxed text-zinc-300">
            If you like it, use it. If it helps you, share it. If you want to
            support it, you can contribute or donate.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://github.com/ChiragBhargavaa/reconcile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition-all hover:bg-white/20"
            >
              <Github size={16} />
              View on GitHub
            </a>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-500 ring-1 ring-white/10"
            >
              <Heart size={16} />
              Donate (coming soon)
            </button>
          </div>
        </section>

        {/* About Me */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            About me
          </h2>

          <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-zinc-300">
            <p>
              I&apos;m{" "}
              <span className="font-semibold text-white">Chirag Bhargava</span>.
            </p>
            <p>B.Tech student at LNMIIT, Jaipur.</p>
            <p>
              I&apos;m a full stack engineer who enjoys building products from
              idea to deployment. I also work with app development using Expo and
              love turning small frustrations into real software.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://github.com/ChiragBhargavaa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition-all hover:bg-white/20"
            >
              <Github size={16} />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/chiragbhargava/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition-all hover:bg-white/20"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
            <a
              href="https://www.upwork.com/freelancers/~011fc977b142d0aa46?mp_source=share"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition-all hover:bg-white/20"
            >
              <ExternalLink size={16} />
              Upwork
            </a>
          </div>
        </section>

        <footer className="mt-20 border-t border-white/10 pt-8 text-center text-xs text-zinc-500">
          Built with care by Chirag Bhargava
        </footer>
      </div>
    </div>
  );
}
