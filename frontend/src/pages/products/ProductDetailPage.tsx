import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/http";
import { deleteProduct, getProduct } from "../../api/products";
import type { Product } from "../../types";
import { ProductCategories, PreparationTypes } from "../../constants";

function labelOf<T extends string>(value: T | undefined, items: { value: T; label: string }[]) {
  if (!value) return "Unknown";
  return items.find((x) => x.value === value)?.label ?? value;
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then((p) => {
        if (cancelled) return;
        setItem(p);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Не получается удалить продукт");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onDelete() {
    if (!id) return;
    if (!confirm("Удалить продукт?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(id);
      navigate("/products");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === "PRODUCT_IN_USE") {
        const dishes = (e.details as any)?.dishes as { id: string; name: string }[] | undefined;
        const list = dishes?.map((d) => `- ${d.name}`).join("\n") ?? "";
        setError(`${e.message}\n${list}`);
      } else {
        setError(e instanceof ApiError ? e.message : "Не получается удалить продукт");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="muted">Loading…</div>;
  if (!item) return <div className="muted">Not found.</div>;

  return (
    <div className="stack gap16">
      <div className="row spaceBetween alignCenter">
        <div className="stack gap4">
          <h1 className="h1">{item.name}</h1>
          <div className="muted">
            {labelOf(item.category ?? "", ProductCategories as any)} ·{" "}
            {labelOf(item.preparationType, PreparationTypes as any)}
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            Создан: {new Date(item.createdAt).toLocaleString()}
            {item.updatedAt ? ` · Обновлён: ${new Date(item.updatedAt).toLocaleString()}` : ""}
          </div>
        </div>

        <div className="row gap8">
          <Link className="btn" to={`/products/${item.id}/edit`}>
            Редактировать
          </Link>
          <button className="btn danger" onClick={onDelete} disabled={deleting}>
            {deleting ? "Удаляется..." : "Удалить"}
          </button>
        </div>
      </div>

      {error && <pre className="alert error">{error}</pre>}

      <section className="card stack gap12">
        <div className="stack gap8">
          <div className="label">Фото</div>
          {item.photos.length === 0 ? (
            <div className="muted">Нет фото</div>
          ) : (
            <div className="row wrap gap8">
              {item.photos.map((url, idx) => (
                <img
                  key={`${url}-${idx}`}
                  src={url}
                  alt={`${item.name} photo ${idx + 1}`}
                  style={{ width: 180, height: 120, objectFit: "cover", borderRadius: 8 }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.display = "none";
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid4 gap12">
          <div className="stat">
            <div className="muted">ккал/порция</div>
            <div className="big">{item.calories}</div>
          </div>
          <div className="stat">
            <div className="muted">Белки</div>
            <div className="big">{item.proteins}</div>
          </div>
          <div className="stat">
            <div className="muted">Жиры</div>
            <div className="big">{item.fats}</div>
          </div>
          <div className="stat">
            <div className="muted">Углеводы</div>
            <div className="big">{item.carbs}</div>
          </div>
        </div>

        <div className="row wrap gap16">
          <span className={item.isVegan ? "badge" : "badge off"}>Веган</span>
          <span className={item.isGlutenFree ? "badge" : "badge off"}>Без глютена</span>
          <span className={item.isSugarFree ? "badge" : "badge off"}>Без сахара</span>
        </div>

        <div className="stack gap6">
          <div className="label">Состав</div>
          <div className="textBlock">{item.compositionText || "—"}</div>
        </div>
      </section>

      <Link className="link" to="/products">
        ← Назад к продуктам
      </Link>
    </div>
  );
}