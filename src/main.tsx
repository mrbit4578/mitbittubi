import { StrictMode, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DataProvider } from "./data";
import "./styles.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Application error", error.name, info.componentStack); }
  render() {
    if (this.state.error) return <main className="app-shell"><h1>Không tải được ESG Hub</h1><p>Dữ liệu đã lưu vẫn được giữ. Tải lại trang để thử lại.</p><button onClick={() => location.reload()}>Tải lại</button></main>;
    return this.props.children;
  }
}

const element = document.getElementById("root");
if (!element) throw new Error("Missing #root element");
createRoot(element).render(<StrictMode><ErrorBoundary><DataProvider><App /></DataProvider></ErrorBoundary></StrictMode>);
