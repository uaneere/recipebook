import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/http";
import {
  calculateNutrition,
  createDish,
  getDish,
  updateDish,
  type DishIngredientInput
} from "../../api/dishes";
import { listProducts } from "../../api/products";
import { DishCategories } from "../../constants";
import type { Product } from "../../types";

type AllowedFlags = { isVegan: boolean; isGlutenFree: boolean; isSugarFree: boolean };

type DishFormState = {
  name: string;
  photos: string[];
  portionSize: number;
  category?: string;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
  ingredients: DishIngredientInput[];
};

const empty: DishFormState = {
  name: "",
  photos: [],
  portionSize: 250,
  category: undefined,
  isVegan: false,
  isGlutenFree: false,
  isSugarFree: false,
  ingredients: [{ productId: "", grams: 100 }]
};

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

export function DishFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<DishFormState>(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<AllowedFlags>({ isVegan: false, isGlutenFree: false, isSugarFree: false });
  
  const [manualMode, setManualMode] = useState(false);
  const [hasCustomNutrition, setHasCustomNutrition] = useState(false);
  
  const [manualNutrition, setManualNutrition] = useState({
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0
  });
  const [calculatedNutrition, setCalculatedNutrition] = useState({
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0
  });

  useEffect(() => {
    listProducts({})
      .then(setProducts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing || !id) return;
    let cancelled = false;
    setLoading(true);
    getDish(id)
      .then((d) => {
        if (cancelled) return;
        setForm({
          name: d.name,
          photos: d.photos,
          portionSize: d.portionSize,
          category: d.category,
          isVegan: d.isVegan,
          isGlutenFree: d.isGlutenFree,
          isSugarFree: d.isSugarFree,
          ingredients: d.ingredients.map((i) => ({ productId: i.product.id, grams: i.grams }))
        });
        
        const dbNutrition = {
          calories: d.calories,
          proteins: d.proteins,
          fats: d.fats,
          carbs: d.carbs
        };
        
        setManualNutrition(dbNutrition);
        setCalculatedNutrition(dbNutrition);
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
  }, [editing, id]);

  const normalizedIngredients = useMemo(() => {
    return form.ingredients
      .filter((i) => i.productId.trim().length > 0)
      .map((i) => ({ productId: i.productId, grams: Number(i.grams) || 0 }))
      .filter((i) => i.grams > 0);
  }, [form.ingredients]);

  useEffect(() => {
    if (normalizedIngredients.length === 0) {
      setAllowed({ isVegan: false, isGlutenFree: false, isSugarFree: false });
      setCalculatedNutrition({ calories: 0, proteins: 0, fats: 0, carbs: 0 });
      return;
    }

    let cancelled = false;
    calculateNutrition(normalizedIngredients)
      .then((r) => {
        if (cancelled) return;
        setAllowed(r.allowedFlags);
        setCalculatedNutrition(r.draftNutrition);
        
        if (!hasCustomNutrition && !manualMode) {
          setManualNutrition({
            calories: roundToTwoDecimals(r.draftNutrition.calories * form.portionSize / 100),
            proteins: roundToTwoDecimals(r.draftNutrition.proteins * form.portionSize / 100),
            fats: roundToTwoDecimals(r.draftNutrition.fats * form.portionSize / 100),
            carbs: roundToTwoDecimals(r.draftNutrition.carbs * form.portionSize / 100)
          });
        }
        
        if (!r.allowedFlags.isVegan && form.isVegan) {
          setForm((f) => ({ ...f, isVegan: false }));
        }
        if (!r.allowedFlags.isGlutenFree && form.isGlutenFree) {
          setForm((f) => ({ ...f, isGlutenFree: false }));
        }
        if (!r.allowedFlags.isSugarFree && form.isSugarFree) {
          setForm((f) => ({ ...f, isSugarFree: false }));
        }
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [normalizedIngredients, form.portionSize]);

  function set<K extends keyof DishFormState>(key: K, value: DishFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setIngredient(idx: number, patch: Partial<DishIngredientInput>) {
    setForm((f) => {
      const next = [...f.ingredients];
      next[idx] = { ...next[idx], ...patch };
      return { ...f, ingredients: next };
    });
  }

  async function addPhotoFromFile(file: File | null) {
    if (!file) return;
    const guessedPath = `/data/${file.name}`;
    set("photos", [...form.photos, guessedPath].slice(0, 5));
  }

  function enableManualMode() {
    setManualMode(true);
  }

  function applyCalculatedValues() {
    setManualNutrition({
      calories: calculatedNutrition.calories,
      proteins: calculatedNutrition.proteins,
      fats: calculatedNutrition.fats,
      carbs: calculatedNutrition.carbs
    });
    setHasCustomNutrition(false);
    setManualMode(false);
  }

  function resetToCalculated() {
    setManualNutrition({
      calories: calculatedNutrition.calories,
      proteins: calculatedNutrition.proteins,
      fats: calculatedNutrition.fats,
      carbs: calculatedNutrition.carbs
    });
  }

  function updateManualNutrition(field: keyof typeof manualNutrition, value: number) {
    setHasCustomNutrition(true);
    setManualNutrition(prev => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError("Название должно содержать не менее 2 символов");
      return;
    }
    if (normalizedIngredients.length < 1) {
      setError("Блюдо должно содержать хотя бы один ингредиент");
      return;
    }

    setSaving(true);
    try {
      const useCustomValues = hasCustomNutrition;
      
      const factor = form.portionSize / 100;
      
      const payload = {
        name: form.name,
        portionSize: form.portionSize,
        category: form.category as any,
        photos: form.photos,
        ingredients: normalizedIngredients,
        isVegan: form.isVegan,
        isGlutenFree: form.isGlutenFree,
        isSugarFree: form.isSugarFree,
        calories: useCustomValues 
          ? manualNutrition.calories 
          : roundToTwoDecimals(calculatedNutrition.calories * factor),
        proteins: useCustomValues 
          ? manualNutrition.proteins 
          : roundToTwoDecimals(calculatedNutrition.proteins * factor),
        fats: useCustomValues 
          ? manualNutrition.fats 
          : roundToTwoDecimals(calculatedNutrition.fats * factor),
        carbs: useCustomValues 
          ? manualNutrition.carbs 
          : roundToTwoDecimals(calculatedNutrition.carbs * factor)
      };

      if (editing && id) {
        const updated = await updateDish(id, payload);
        navigate(`/dishes/${updated.dish.id}`);
      } else {
        const created = await createDish(payload);
        navigate(`/dishes/${created.dish.id}`);
      }
    } catch (e: unknown) {
      console.error("Submit error:", e);
      setError(e instanceof ApiError ? `${e.message}` : "Не удалось сохранить блюдо");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="muted">Загрузка…</div>;

  const displayCalories = manualMode ? manualNutrition.calories : calculatedNutrition.calories;
  const displayProteins = manualMode ? manualNutrition.proteins : calculatedNutrition.proteins;
  const displayFats = manualMode ? manualNutrition.fats : calculatedNutrition.fats;
  const displayCarbs = manualMode ? manualNutrition.carbs : calculatedNutrition.carbs;

  return (
    <div className="stack gap16">
      <div className="row spaceBetween alignCenter">
        <h1 className="h1">{editing ? "Редактировать блюдо" : "Создать блюдо"}</h1>
        <Link className="btn" to={editing && id ? `/dishes/${id}` : "/dishes"}>
          Отмена
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card stack gap12" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">
            Название *{" "}
            <span className="muted">
              (макросы: !десерт !первое !второе !напиток !салат !суп !перекус)
            </span>
          </span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>

        <div className="grid grid2 gap12">
          <label className="field">
            <span className="label">Категория</span>
            <select value={form.category || ""} onChange={(e) => set("category", (e.target.value || undefined) as any)}>
              <option value="">Выберите категорию</option>
              {DishCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Размер порции (г) *</span>
            <input
              type="number"
              min={1}
              step="1"
              value={form.portionSize}
              onChange={(e) => set("portionSize", Number(e.target.value))}
            />
          </label>
        </div>

        <section className="stack gap8">
          <div className="row spaceBetween alignCenter">
            <div className="label">Ингредиенты *</div>
            <button
              type="button"
              className="btn"
              onClick={() => set("ingredients", [...form.ingredients, { productId: "", grams: 100 }])}
            >
              Добавить ингредиент
            </button>
          </div>

          <div className="stack gap8">
            {form.ingredients.map((ing, idx) => (
              <div key={idx} className="row gap8 alignCenter">
                <select
                  className="grow"
                  value={ing.productId}
                  onChange={(e) => setIngredient(idx, { productId: e.target.value })}
                >
                  <option value="">Выберите продукт…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  style={{ width: 140 }}
                  type="number"
                  min={1}
                  step="1"
                  value={ing.grams}
                  onChange={(e) => setIngredient(idx, { grams: Number(e.target.value) })}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => set("ingredients", form.ingredients.filter((_, i) => i !== idx))}
                  disabled={form.ingredients.length <= 1}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="stack gap8">
          <div className="row spaceBetween alignCenter">
            <div className="label">Пищевая ценность (на 100г)</div>
            <div className="row gap8">
              {manualMode ? (
                <>
                  <button type="button" className="btn primary" onClick={applyCalculatedValues}>
                    Сохранить
                  </button>
                  <button type="button" className="btn" onClick={resetToCalculated}>
                    Сбросить
                  </button>
                </>
              ) : (
                <button type="button" className="btn" onClick={enableManualMode}>
                  Ручная настройка
                </button>
              )}
            </div>
          </div>

          {manualMode ? (
            <div className="grid grid4 gap12">
              <label className="field">
                <span className="label">Калории *</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={manualNutrition.calories}
                  onChange={(e) => updateManualNutrition("calories", Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="label">Белки *</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={manualNutrition.proteins}
                  onChange={(e) => updateManualNutrition("proteins", Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="label">Жиры *</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={manualNutrition.fats}
                  onChange={(e) => updateManualNutrition("fats", Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="label">Углеводы *</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={manualNutrition.carbs}
                  onChange={(e) => updateManualNutrition("carbs", Number(e.target.value))}
                />
              </label>
            </div>
          ) : (
            <div className="grid grid4 gap12">
              <div className="stat">
                <div className="muted">Калории</div>
                <div className="big">{roundToTwoDecimals(displayCalories)}</div>
              </div>
              <div className="stat">
                <div className="muted">Белки</div>
                <div className="big">{roundToTwoDecimals(displayProteins)}</div>
              </div>
              <div className="stat">
                <div className="muted">Жиры</div>
                <div className="big">{roundToTwoDecimals(displayFats)}</div>
              </div>
              <div className="stat">
                <div className="muted">Углеводы</div>
                <div className="big">{roundToTwoDecimals(displayCarbs)}</div>
              </div>
            </div>
          )}
        </section>

        <section className="stack gap8">
          <div className="row spaceBetween alignCenter">
            <div className="label">Фото (макс 5)</div>
            <div className="row gap8">
              <label className="btn" style={{ cursor: "pointer" }}>
                Загрузить файл
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const f = e.currentTarget.files?.[0] ?? null;
                    try {
                      await addPhotoFromFile(f);
                    } catch {
                      setError("Не удалось загрузить изображение");
                    } finally {
                      e.currentTarget.value = "";
                    }
                  }}
                  disabled={form.photos.length >= 5}
                />
              </label>
              <button
                type="button"
                className="btn"
                onClick={() => set("photos", [...form.photos, "/data/"].slice(0, 5))}
                disabled={form.photos.length >= 5}
              >
                Добавить путь
              </button>
            </div>
          </div>
          
          <div className="stack gap8">
            {form.photos.map((url, idx) => (
              <div key={idx} className="row gap8 alignCenter">
                <input
                  className="grow"
                  value={url}
                  placeholder="/data/image.png"
                  onChange={(e) => {
                    const next = [...form.photos];
                    next[idx] = e.target.value;
                    set("photos", next);
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => set("photos", form.photos.filter((_, i) => i !== idx))}
                >
                  Удалить
                </button>
              </div>
            ))}
            {form.photos.length === 0 && <div className="muted">Нет фото</div>}
          </div>
        </section>

        <section className="stack gap8">
          <div className="label">Метки</div>
          <div className="row wrap gap16">
            <label className="check">
              <input
                type="checkbox"
                checked={form.isVegan}
                disabled={!allowed.isVegan}
                onChange={(e) => set("isVegan", e.target.checked)}
              />
              Веган
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isGlutenFree}
                disabled={!allowed.isGlutenFree}
                onChange={(e) => set("isGlutenFree", e.target.checked)}
              />
              Без глютена
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isSugarFree}
                disabled={!allowed.isSugarFree}
                onChange={(e) => set("isSugarFree", e.target.checked)}
              />
              Без сахара
            </label>
          </div>
        </section>

        <div className="row gap8">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}