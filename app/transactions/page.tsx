import { TransactionList } from "@/components/Transaction/TransactionList";

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <h1 className="text-2xl font-semibold text-[#1a1a2e]">Transactions</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Filtre, consulte la preuve ou modifie.
      </p>
      <div className="mt-5">
        <TransactionList />
      </div>
    </div>
  );
}
