import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Layout } from "./components/Layout";
import { ProductDetailPage } from "./pages/products/ProductDetailPage";
import { ProductFormPage } from "./pages/products/ProductFormPage";
import { ProductsListPage } from "./pages/products/ProductsListPage";
import { DishesListPage } from "./pages/dishes/DishesListPage";
import { DishDetailPage } from "./pages/dishes/DishDetailPage";
import { DishFormPage } from "./pages/dishes/DishFormPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />

        <Route path="/dishes" element={<DishesListPage />} />
        <Route path="/dishes/new" element={<DishFormPage />} />
        <Route path="/dishes/:id" element={<DishDetailPage />} />
        <Route path="/dishes/:id/edit" element={<DishFormPage />} />
      </Route>
    </Routes>
  );
}