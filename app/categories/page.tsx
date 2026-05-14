import { CategoryManager } from "@/components/Category/CategoryManager";

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <h1 className="text-2xl font-semibold text-[#1a1a2e]">Catégories</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Ajuste les taux de déductibilité selon ta situation.
      </p>
      <div className="mt-5">
        <CategoryManager />
      </div>
    </div>
  );
}
