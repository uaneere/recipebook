import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/http";
import { createProduct, getProduct, updateProduct, type ProductInput } from "../../api/products";
import { PreparationTypes, ProductCategories } from "../../constants";
import type { ProductCategory } from "../../types";

type ProductFormState = Omit<ProductInput, "calories" | "proteins" | "fats" | "carbs"> & {
  calories: string;
  proteins: string;
  fats: string;
  carbs: string;
  category?: ProductCategory;
};

const empty: ProductFormState = {
  name: "",
  photos: [],
  calories: "0",
  proteins: "0",
  fats: "0",
  carbs: "0",
  compositionText: null,
  category: undefined,
  preparationType: "ReadyToEat",
  isVegan: false,
  isGlutenFree: false,
  isSugarFree: false
};

function isNumericInput(value: string) {
  return /^\d*(?:\.\d*)?$/.test(value);
}

function roundToTwoDecimals(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return String(Math.round(num * 100) / 100);
}

export function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormState>(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const numericProteins = Number(form.proteins || "0");
  const numericFats = Number(form.fats || "0");
  const numericCarbs = Number(form.carbs || "0");
  const sumBju = useMemo(() => numericProteins + numericFats + numericCarbs, [numericProteins, numericFats, numericCarbs]);

  useEffect(() => {
    if (!editing || !id) return;
    let cancelled = false;
    setLoading(true);
    getProduct(id)
      .then((p) => {
        if (cancelled) return;
        setForm({
          name: p.name,
          photos: p.photos,
          calories: String(p.calories),
          proteins: String(p.proteins),
          fats: String(p.fats),
          carbs: String(p.carbs),
          compositionText: p.compositionText,
          category: p.category,
          preparationType: p.preparationType,
          isVegan: p.isVegan,
          isGlutenFree: p.isGlutenFree,
          isSugarFree: p.isSugarFree
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Не удалось загрузить продукт");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  function setNumberField(key: keyof Pick<ProductFormState, "calories" | "proteins" | "fats" | "carbs">, value: string) {
    if (isNumericInput(value)) {
      setForm((f) => ({ ...f, [key]: value }));
      if (warning) setWarning(null);
    }
  }

  function normalizeNumberField(key: keyof Pick<ProductFormState, "calories" | "proteins" | "fats" | "carbs">, value: string) {
    const nextValue = value.trim() === "" ? "0" : roundToTwoDecimals(value);
    if (nextValue !== value && value.trim() !== "") {
      setWarning("Значения округлены до двух знаков после запятой.");
    }
    setForm((f) => ({ ...f, [key]: nextValue }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError("Название должно содержать не менее 2 символов.");
      return;
    }
    if (sumBju > 100) {
      setError("Сумма белков, жиров и углеводов должна быть ≤ 100.");
      return;
    }
    if (form.photos.length > 5) {
      setError("Максимум 5 фото (URL).");
      return;
    }

    setWarning(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        calories: Number(form.calories || "0"),
        proteins: Number(form.proteins || "0"),
        fats: Number(form.fats || "0"),
        carbs: Number(form.carbs || "0")
      } as ProductInput;

      if (editing && id) {
        await updateProduct(id, payload);
        navigate(`/products/${id}`);
      } else {
        const created = await createProduct(payload);
        navigate(`/products/${created.id}`);
      }
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить продукт");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function addPhotoFromFile(file: File | null) {
    if (!file) return;
    const guessedPath = `/data/${file.name}`;
    set("photos", [...form.photos, guessedPath].slice(0, 5));
  }

  if (loading) return <div className="muted">Загрузка…</div>;

  return (
    <div className="stack gap16">
      <div className="row spaceBetween alignCenter">
        <h1 className="h1">{editing ? "Редактировать продукт" : "Создать продукт"}</h1>
        <Link className="btn" to={editing && id ? `/products/${id}` : "/products"}>
          Отмена
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card stack gap12" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">Название *</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>

        <div className="grid grid2 gap12">
          <label className="field">
            <span className="label">Категория *</span>
            <select value={form.category || ""} onChange={(e) => set("category", (e.target.value || undefined) as any)}>
              <option value="">Выберите категорию</option>
              {ProductCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Тип *</span>
            <select value={form.preparationType} onChange={(e) => set("preparationType", e.target.value as any)}>
              {PreparationTypes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid4 gap12">
          <label className="field">
            <span className="label">Калории (ккал/100г) *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.calories}
              onChange={(e) => setNumberField("calories", e.target.value)}
              onBlur={(e) => normalizeNumberField("calories", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Белки *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.proteins}
              onChange={(e) => setNumberField("proteins", e.target.value)}
              onBlur={(e) => normalizeNumberField("proteins", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Жиры *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.fats}
              onChange={(e) => setNumberField("fats", e.target.value)}
              onBlur={(e) => normalizeNumberField("fats", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Углеводы *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.carbs}
              onChange={(e) => setNumberField("carbs", e.target.value)}
              onBlur={(e) => normalizeNumberField("carbs", e.target.value)}
            />
          </label>
        </div>

        <div className={sumBju > 100 ? "alert error" : "alert"}>
          Сумма БЖУ: <b>{sumBju.toFixed(2)}</b> (должна быть ≤ 100)
        </div>
        {warning && <div className="alert">{warning}</div>}

        <label className="field">
          <span className="label">Состав</span>
          <textarea
            rows={4}
            value={form.compositionText ?? ""}
            onChange={(e) => set("compositionText", e.target.value.trim().length ? e.target.value : null)}
          />
        </label>

        <div className="stack gap8">
          <div className="label">Метки</div>
          <div className="row wrap gap16">
            <label className="check">
              <input type="checkbox" checked={form.isVegan} onChange={(e) => set("isVegan", e.target.checked)} />
              Веган
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isGlutenFree}
                onChange={(e) => set("isGlutenFree", e.target.checked)}
              />
              Без глютена
            </label>
            <label className="check">
              <input type="checkbox" checked={form.isSugarFree} onChange={(e) => set("isSugarFree", e.target.checked)} />
              Без сахара
            </label>
          </div>
        </div>

        <div className="stack gap8">
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
                      setError("Не удалось загрузить изображение.");
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
        </div>

        <div className="row gap8">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}