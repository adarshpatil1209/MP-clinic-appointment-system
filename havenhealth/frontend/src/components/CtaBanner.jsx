import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PrimaryButton } from "./ui";

export default function CtaBanner() {
  return (
    <section className="px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-[2.5rem] bg-amber-500 p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
        <div>
          <h2 className="balance font-display text-3xl font-semibold text-forest-950 sm:text-4xl">
            Ready to feel taken care of?
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-forest-900/80">
            Create your free account and book your first visit in under two
            minutes. No insurance card required to get started.
          </p>
        </div>
        <PrimaryButton
          as={Link}
          to="/register"
          className="whitespace-nowrap bg-forest-950 text-cream hover:bg-forest-900"
        >
          Create free account <ArrowUpRight size={16} />
        </PrimaryButton>
      </div>
    </section>
  );
}
