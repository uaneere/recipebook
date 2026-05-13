import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/http";
import { deleteDish, getDish } from "../../api/dishes";
import { DishCategories } from "../../constants";
import type { DishWithIngredients } from "../../types";

function labelDishCategory(v: string | undefined) {
  if (!v) return "Unknown";
  return DishCategories.find((x) => x.value === v)?.label ?? v;
}

export function DishDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<DishWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDish(id)
      .then((d) => {
        if (cancelled) return;
        setItem(d);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Не удалось загрузить блюдо");
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
    if (!confirm("Удалить блюдо?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteDish(id);
      navigate("/dishes");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Не удалось удалить блюдо");
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
          <div className="muted">{labelDishCategory(item.category)}</div>
          <div className="muted" style={{ fontSize: 14 }}>
            Создано: {new Date(item.createdAt).toLocaleString()}
            {item.updatedAt && item.updatedAt !== item.createdAt 
              ? ` · Обновлено: ${new Date(item.updatedAt).toLocaleString()}` 
              : ""}
          </div>
        </div>
        <div className="row gap8">
          <Link className="btn" to={`/dishes/${item.id}/edit`}>
            Редактировать
          </Link>
          <button className="btn danger" onClick={onDelete} disabled={deleting}>
            {deleting ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

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
                  style={{
                    width: 180,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8
                  }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.display = "none";
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {}
        {(() => {

          return (
            <div className="grid grid4 gap12">
              <div className="stat">
                <div className="muted">ккал/порц.</div>
                <div className="big">
                  {item.calories}
                </div>
              </div>

              <div className="stat">
                <div className="muted">Белки</div>
                <div className="big">
                  {item.proteins}
                </div>
              </div>

              <div className="stat">
                <div className="muted">Жиры</div>
                <div className="big">
                  {item.fats}
                </div>
              </div>

              <div className="stat">
                <div className="muted">Углеводы</div>
                <div className="big">
                  {item.carbs}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="row wrap gap16">
          <span className={item.isVegan ? "badge" : "badge off"}>Веган</span>
          <span className={item.isGlutenFree ? "badge" : "badge off"}>Без глютена</span>
          <span className={item.isSugarFree ? "badge" : "badge off"}>Без сахара</span>
        </div>

        <div className="row spaceBetween alignCenter">
          <div className="label">Размер порции</div>
          <div className="strong">{item.portionSize}г</div>
        </div>
      </section>

      <Link className="link" to="/dishes">
        ← Назад к блюдам
      </Link>
    </div>
  );
}