import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts, type ProductListParams } from "../../api/products";
import { ProductCategories, PreparationTypes } from "../../constants";
import { ApiError } from "../../api/http";
import type { Product } from "../../types";

export function ProductsListPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [preparationType, setPreparationType] = useState<string>("");
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isSugarFree, setIsSugarFree] = useState(false);
  const [sortBy, setSortBy] = useState<ProductListParams["sortBy"]>("name");
  const [sortDir, setSortDir] = useState<ProductListParams["sortDir"]>("asc");

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo<ProductListParams>(
    () => ({
      q: q.trim() ? q.trim() : undefined,
      category: (category || undefined) as ProductListParams["category"],
      preparationType: (preparationType || undefined) as ProductListParams["preparationType"],
      isVegan: isVegan ? true : undefined,
      isGlutenFree: isGlutenFree ? true : undefined,
      isSugarFree: isSugarFree ? true : undefined,
      sortBy,
      sortDir
    }),
    [q, category, preparationType, isVegan, isGlutenFree, isSugarFree, sortBy, sortDir]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProducts(params)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof ApiError ? e.message : "Failed to load products";
        setError(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="stack gap16">
      <div className="row spaceBetween alignCenter">
        <h1 className="h1">Продукты</h1>
        <Link className="btn primary" to="/products/new">
          Создать продукт
        </Link>
      </div>

      <section className="card stack gap12">
        <div className="grid grid3 gap12">
          <label className="field">
            <span className="label">Поиск</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="По названию..." />
          </label>

          <label className="field">
            <span className="label">Категория</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Все</option>
              {ProductCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Тип</span>
            <select value={preparationType} onChange={(e) => setPreparationType(e.target.value)}>
              <option value="">Все</option>
              {PreparationTypes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="row wrap gap16 alignCenter">
          <label className="check">
            <input type="checkbox" checked={isVegan} onChange={(e) => setIsVegan(e.target.checked)} />
            Веган
          </label>
          <label className="check">
            <input type="checkbox" checked={isGlutenFree} onChange={(e) => setIsGlutenFree(e.target.checked)} />
            Без глютена
          </label>
          <label className="check">
            <input type="checkbox" checked={isSugarFree} onChange={(e) => setIsSugarFree(e.target.checked)} />
            Без сахара
          </label>

          <div className="spacer" />

          <label className="field inline">
            <span className="label">Сортировка</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as ProductListParams["sortBy"])}>
              <option value="name">Название</option>
              <option value="calories">Калории</option>
              <option value="proteins">Белки</option>
              <option value="fats">Жиры</option>
              <option value="carbs">Углеводы</option>
            </select>
          </label>
          <label className="field inline">
            <span className="label">Направление</span>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as ProductListParams["sortDir"])}>
              <option value="asc">По возр.</option>
              <option value="desc">По убыв.</option>
            </select>
          </label>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        {loading ? (
          <div className="muted">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="muted">Продукты не найдены.</div>
        ) : (
          <div className="table">
            <div className="thead">
              <div>Название</div>
              <div className="num">ккал/100г</div>
              <div className="num">Б</div>
              <div className="num">Ж</div>
              <div className="num">У</div>
            </div>
            {items.map((p) => (
              <Link key={p.id} className="trow" to={`/products/${p.id}`}>
                <div className="strong">{p.name}</div>
                <div className="num">{p.calories}</div>
                <div className="num">{p.proteins}</div>
                <div className="num">{p.fats}</div>
                <div className="num">{p.carbs}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}