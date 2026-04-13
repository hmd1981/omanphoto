import { CategoriesManager } from "@/components/admin/categories-manager";

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Categories</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Categories used as filters on the Galleries page. Unpublished categories stay hidden on the public site.
      </p>
      <CategoriesManager />
    </div>
  );
}
