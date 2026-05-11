import { NavLink, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="appShell">
      <header className="topbar">
        <div className="container topbarInner">
          <div className="brand">Книга рецептов</div>
          <nav className="nav">
            <NavLink
              className={({ isActive }: { isActive: boolean }) => (isActive ? "navLink active" : "navLink")}
              to="/products"
            >
              Продукты
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) => (isActive ? "navLink active" : "navLink")}
              to="/dishes"
            >
              Блюда
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container content">
        <Outlet />
      </main>
    </div>
  );
}