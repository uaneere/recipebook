import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/http";
import { listDishes, type DishListParams } from "../../api/dishes";
import { DishCategories } from "../../constants";
import type { Dish } from "../../types";

export function DishesListPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isSugarFree, setIsSugarFree] = useState(false);
  const [sortBy, setSortBy] = useState<DishListParams["sortBy"]>("name");
  const [sortDir, setSortDir] = useState<DishListParams["sortDir"]>("asc");

  const [items, setItems] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo<DishListParams>(
    () => ({
      q: q.trim() ? q.trim() : undefined,
      category: (category || undefined) as DishListParams["category"],
      isVegan: isVegan ? true : undefined,
      isGlutenFree: isGlutenFree ? true : undefined,
      isSugarFree: isSugarFree ? true : undefined,
      sortBy,
      sortDir
    }),
    [q, category, isVegan, isGlutenFree, isSugarFree, sortBy, sortDir]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listDishes(params)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Блюда не найдены");
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
        <h1 className="h1">Блюда</h1>
        <Link className="btn primary" to="/dishes/new">
          Создать блюдо
        </Link>
      </div>

      <section className="card stack gap12">
        <div className="grid grid3 gap12">
          <label className="field">
            <span className="label">Поиск</span>
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="По названию..." 
            />
          </label>

          <label className="field">
            <span className="label">Категория</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Все</option>
              {DishCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="row wrap gap16 alignCenter">
          <label className="check">
            <input 
              type="checkbox" 
              checked={isVegan} 
              onChange={(e) => setIsVegan(e.target.checked)} 
            />
            Веган
          </label>
          <label className="check">
            <input 
              type="checkbox" 
              checked={isGlutenFree} 
              onChange={(e) => setIsGlutenFree(e.target.checked)} 
            />
            Без глютена
          </label>
          <label className="check">
            <input 
              type="checkbox" 
              checked={isSugarFree} 
              onChange={(e) => setIsSugarFree(e.target.checked)} 
            />
            Без сахара
          </label>

          <div className="spacer" />

          <label className="field inline">
            <span className="label">Сортировка</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as DishListParams["sortBy"])}
            >
              <option value="name">Название</option>
              <option value="calories">Калории</option>
              <option value="proteins">Белки</option>
              <option value="fats">Жиры</option>
              <option value="carbs">Углеводы</option>
            </select>
          </label>
          
          <label className="field inline">
            <span className="label">Направление</span>
            <select 
              value={sortDir} 
              onChange={(e) => setSortDir(e.target.value as DishListParams["sortDir"])}
            >
              <option value="asc">По возрастанию</option>
              <option value="desc">По убыванию</option>
            </select>
          </label>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        {loading ? (
          <div className="muted">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="muted">Блюда не найдены.</div>
        ) : (
          <div className="table">
            <div className="thead" style={{ gridTemplateColumns: "1.2fr repeat(4, 0.6fr)" }}>
              <div>Название</div>
              <div className="num">ккал/порцию</div>
              <div className="num">Б</div>
              <div className="num">Ж</div>
              <div className="num">У</div>
            </div>
            {items.map((d) => (
              <Link
                key={d.id}
                className="trow"
                style={{ gridTemplateColumns: "1.2fr repeat(4, 0.6fr)" }}
                to={`/dishes/${d.id}`}
              >
                <div className="strong">{d.name}</div>
                <div className="num">{d.calories}</div>
                <div className="num">{d.proteins}</div>
                <div className="num">{d.fats}</div>
                <div className="num">{d.carbs}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}