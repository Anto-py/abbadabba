import { TransactionEditForm } from "@/components/Transaction/TransactionEditForm";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <h1 className="text-2xl font-semibold text-[#1a1a2e]">Modifier</h1>
      <p className="mt-1 text-sm text-zinc-600">La preuve reste inchangée.</p>
      <div className="mt-5">
        <TransactionEditForm id={id} />
      </div>
    </div>
  );
}
