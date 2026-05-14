import { TransactionForm } from "@/components/Transaction/TransactionForm";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <h1 className="text-2xl font-semibold text-[#1a1a2e]">
        Nouvelle transaction
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Recette ou dépense — preuve photo ou fichier.
      </p>
      <div className="mt-5">
        <TransactionForm />
      </div>
    </div>
  );
}
